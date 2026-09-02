import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

/*
 * bulkPaymentService reads mdb.REST lazily and issues KashFlow calls via the
 * kfSession singleton, so both can be patched with plain fakes — no database
 * and no network. The service captured `kfAxios = kfSession.kfAxios` at load,
 * so we mutate that SAME object's .get/.post rather than reassigning it.
 */
import kfSession from '../services/kashflowSessionService.js';
import bulkPay, { outstandingAmount } from '../mongoose/services/bulkPaymentService.js';

// withKfAuth just needs to hand the callback a token.
kfSession.withKfAuth = async (fn) => fn('test-token');

function stubLivePurchases(byNumber) {
  kfSession.kfAxios.get = mock.fn(async (url) => {
    const m = String(url).match(/\/purchases\/(\d+)/);
    const n = m ? Number(m[1]) : null;
    if (n != null && Object.prototype.hasOwnProperty.call(byNumber, n)) {
      return { data: byNumber[n] };
    }
    const err = new Error('Not found');
    err.response = { status: 404 };
    throw err;
  });
}

describe('bulkPaymentService', () => {
  describe('outstandingAmount', () => {
    it('prefers DueAmount when present', () => {
      assert.equal(outstandingAmount({ DueAmount: 120.5, GrossAmount: 200, TotalPaidAmount: 50 }), 120.5);
    });
    it('falls back to gross minus paid', () => {
      assert.equal(outstandingAmount({ GrossAmount: 200, TotalPaidAmount: 75 }), 125);
    });
    it('is zero for a null doc', () => {
      assert.equal(outstandingAmount(null), 0);
    });
  });

  describe('reverify', () => {
    beforeEach(() => {
      stubLivePurchases({
        101: { Id: 1, Number: 101, DueAmount: 300, GrossAmount: 300, Status: 'Unpaid', SupplierName: 'Acme', SupplierId: 9, SupplierCode: 'ACM' },
        102: { Id: 2, Number: 102, DueAmount: 0, GrossAmount: 500, Status: 'Paid', SupplierName: 'Beta' },
        103: { Id: 3, Number: 103, DueAmount: 40, GrossAmount: 40, Status: 'Unpaid', SupplierName: 'Gamma' },
      });
    });

    it('passes a payable line and totals only payable lines', async () => {
      const r = await bulkPay.reverify([{ number: 101, amount: 300 }]);
      assert.equal(r.ok, true);
      assert.equal(r.blocking, 0);
      assert.equal(r.total, 300);
      assert.equal(r.lines[0].supplierName, 'Acme');
    });

    it('blocks an already-settled invoice', async () => {
      const r = await bulkPay.reverify([{ number: 102, amount: 100 }]);
      assert.equal(r.lines[0].ok, false);
      assert.match(r.lines[0].problem, /already settled/i);
      assert.equal(r.blocking, 1);
      assert.equal(r.total, 0);
    });

    it('blocks an amount over what is now due', async () => {
      const r = await bulkPay.reverify([{ number: 103, amount: 60 }]);
      assert.equal(r.lines[0].ok, false);
      assert.match(r.lines[0].problem, /exceeds/i);
    });

    it('blocks a purchase that no longer exists', async () => {
      const r = await bulkPay.reverify([{ number: 999, amount: 10 }]);
      assert.equal(r.lines[0].ok, false);
      assert.match(r.lines[0].problem, /no longer exists/i);
    });

    it('rejects a non-positive amount without calling KashFlow', async () => {
      const r = await bulkPay.reverify([{ number: 101, amount: 0 }]);
      assert.equal(r.lines[0].ok, false);
      assert.match(r.lines[0].problem, /greater than zero/i);
    });

    it('reports mixed batches as not-all-ok with the right total', async () => {
      const r = await bulkPay.reverify([
        { number: 101, amount: 300 },
        { number: 102, amount: 100 },
      ]);
      assert.equal(r.ok, false);        // one line blocked
      assert.equal(r.blocking, 1);
      assert.equal(r.total, 300);       // only the payable line counts
    });
  });

  describe('createBulkPayment', () => {
    it('POSTs a well-formed BulkPayment_Create payload', async () => {
      let captured = null;
      kfSession.kfAxios.post = mock.fn(async (url, payload) => {
        captured = { url, payload };
        return { data: { Number: 777 } };
      });

      const res = await bulkPay.createBulkPayment({
        accountId: 55,
        date: '2026-09-02',
        method: 5,
        comment: 'September run',
        lines: [
          { number: 101, Id: 1, requestedAmount: 300, supplierId: 9, supplierCode: 'ACM', supplierName: 'Acme' },
          { number: 103, Id: 3, requestedAmount: 40, supplierName: 'Gamma' },
        ],
      });

      assert.equal(res.ok, true);
      assert.equal(res.bulkPaymentNumber, 777);
      assert.match(captured.url, /\/purchases\/bulk\/payments$/);
      assert.equal(captured.payload.AccountId, 55);
      assert.equal(captured.payload.Method, 5);
      assert.equal(captured.payload.Date, '2026-09-02');
      assert.equal(captured.payload.Comment, 'September run');
      assert.equal(captured.payload.PaymentItems.length, 2);

      const first = captured.payload.PaymentItems[0];
      assert.equal(first.ObjectNumber, 101);
      assert.equal(first.Amount, 300);
      assert.equal(first.PaidDate, '2026-09-02');
      assert.equal(first.Id, 1);
      assert.equal(first.ContactId, 9);
      assert.equal(first.ContactCode, 'ACM');
    });
  });
});
