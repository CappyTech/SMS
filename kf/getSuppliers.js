function getSuppliers(client) {
  return new Promise((resolve, reject) => {
    const suppliersParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetSuppliers(suppliersParams, async (err, result) => {
      if (err) {
        console.error('Error calling GetSuppliers method:', err);
        return reject(err);
      }

      const suppliers = result.GetSuppliersResult.Supplier;

      if (suppliers && suppliers.length) {
        console.log('Total number of suppliers:', suppliers.length);
        resolve(suppliers);
      } else {
        console.log('No suppliers found.');
        resolve([]);
      }
    });
  });
}

module.exports = getSuppliers;
