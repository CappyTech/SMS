const soap = require('soap');

// Define your API credentials
const username = 'admin@heroncs.co.uk';      // Replace with your actual KashFlow username
const password = 'fNw:p)xg^gKM1$';      // Replace with your actual KashFlow password
const autoAuthKey = '558C23E3-A683';   // Your actual AutoAuthKey
const appName = 'HERONCSLTD';       // Set a name for your application (this can be any identifier)

// The WSDL URL for the KashFlow API
const wsdlUrl = 'https://securedwebapp.com/api/service.asmx?WSDL';

// Create SOAP client and call the AutoAuthIP method first
soap.createClient(wsdlUrl, (err, client) => {
  if (err) {
    console.error('Error creating SOAP client:', err);
    return;
  }

  console.log('SOAP client created successfully.');

  // Prepare the parameters for the AutoAuthIP call
  const authParams = {
    UserName: username,
    Password: password,
    appName: appName,
    AutoAuthKey: autoAuthKey
  };

  // Call the AutoAuthIP method
  client.AutoAuthIP(authParams, (err, authResult) => {
    if (err) {
      console.error('Error calling AutoAuthIP method:', err);
      return;
    }

    console.log('AutoAuthIP Result:', authResult);

    // If AutoAuthIP is successful, then call the GetProjects method
    if (authResult && authResult.Status === 'OK') {
      console.log('AutoAuthIP successful, proceeding to GetProjects.');

      // Prepare the parameters for GetProjects call (with UserName and Password)
      const projectParams = {
        UserName: username,  // Use the actual username here
        Password: password   // Use the actual password here
      };

      // Call GetProjects using the correct parameters
      client.GetProjects(projectParams, (err, result) => {
        if (err) {
          console.error('Error calling GetProjects method:', err);
        } else {
          console.log('Projects retrieved successfully:');
          console.log('Total number of projects:', result.GetProjectsResult.BasicDataset.length);

          // Log the first few projects for review
          const projects = result.GetProjectsResult.BasicDataset.slice(0, 5); // Get first 5 projects

          projects.forEach((project, index) => {
            console.log(`Project ${index + 1}:`);
            console.log(`ID: ${project.ID}`);
            console.log(`Name: ${project.Name}`);
            console.log(`Description: ${project.Description}`);
            console.log(`Value: ${project.Value}`);
            console.log(`Reference: ${project.Reference}`);
            console.log(`Status: ${project.Status}`);
            console.log(`Number: ${project.Number}`);
            console.log('---------------------');
          });
        }
      });
    } else {
      console.log('Failed to authenticate with AutoAuthIP:', authResult.StatusDetail);
    }
  });
});

