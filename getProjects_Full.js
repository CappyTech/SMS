const soap = require('soap');
require('dotenv').config({ path: '../.env' });

const username = process.env.KFUSERNAME;
const password = process.env.KFPASSWORD;
const autoAuthKey = process.env.autoAuthKey;
const appName = process.env.appName;

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

    // If AutoAuthIP is successful, then call the GetProjects_Full method
    if (authResult && authResult.Status === 'OK') {
      console.log('AutoAuthIP successful, proceeding to GetProjects_Full.');

      // Prepare the parameters for GetProjects_Full call (ProjStatus can be set to filter by project status)
      const projectFullParams = {
        UserName: username,
        Password: password,
        ProjStatus: 1
      };

      // Call GetProjects_Full using the correct parameters
      client.GetProjects_Full(projectFullParams, (err, result) => {
        if (err) {
          console.error('Error calling GetProjects_Full method:', err);
        } else {
          console.log('Projects retrieved successfully:');
          const projects = result.GetProjects_FullResult.Project;

          // Log the total number of projects
          console.log('Total number of projects:', projects.length);

          // Iterate through all the projects and log their details
          projects.forEach((project, index) => {
            console.log(`Project ${index + 1}:`);
            console.log(`ID: ${project.ID}`);
            console.log(`Number: ${project.Number}`);
            console.log(`Name: ${project.Name}`);
            console.log(`Reference: ${project.Reference}`);
            console.log(`Description: ${project.Description}`);
            console.log(`Date1: ${project.Date1}`);
            console.log(`Date2: ${project.Date2}`);
            console.log(`CustomerID: ${project.CustomerID}`);
            console.log(`Status: ${project.Status === 0 ? 'Completed' : project.Status === 1 ? 'Active' : 'Archived'}`);
            console.log('---------------------');
          });
        }
      });
    } else {
      console.log('Failed to authenticate with AutoAuthIP:', authResult.StatusDetail);
    }
  });
});
