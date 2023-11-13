const express = require('express');
const router = express.Router();

const getSubcontractorData = async (id, year) => {
  return await Subcontractor.findOne({
    where: { id },
    include: {
      model: Invoice,
      as: 'invoices',
      where: { year },
      order: [['month', 'ASC']],
    },
  });
};

const groupInvoicesByMonth = (invoices) => {
  const invoicesByMonth = {};
  invoices.forEach(invoice => {
    const month = invoice.month;
    if (!invoicesByMonth[month]) {
      invoicesByMonth[month] = [];
    }
    invoicesByMonth[month].push(invoice);
  });
  return invoicesByMonth;
};

const renderYearlyReturns = async (req, res) => {
  try {
    const { year, id } = req.params;

    if (!year || !id) {
      console.log("Year and Subcontractor ID are required.");
      return res.status(400).send("Invalid request.");
    }

    const subcontractor = await getSubcontractorData(id, year);

    if (!subcontractor) {
      console.log("Data not found.");
      return res.status(404).send("Data not found.");
    }

    const invoicesByMonth = groupInvoicesByMonth(subcontractor.invoices);

    console.log("Rendering yearly returns:", { subcontractor, year, invoicesByMonth });

    res.render('yearlyReturns', {
      errorMessages: req.flash('error'),
      successMessage: req.flash('success'),
      session: req.session,
      packageJson,
      slimDateTime: slimDateTime,
      formatCurrency: formatCurrency,
      subcontractor: subcontractor,
      year: year,
      invoicesByMonth: invoicesByMonth,
      monthNames: monthNames
    });
  } catch (error) {
    console.error("Error rendering yearly returns:", error);
    res.status(500).send("An error occurred.");
  }
};

router.get('/yearly/returns/:year/:id', renderYearlyReturns);

module.exports = router;