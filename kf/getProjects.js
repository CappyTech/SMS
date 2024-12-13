const logger = require('../services/loggerService');
function getProjects(client) {
  return new Promise((resolve, reject) => {
    const projectFullParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      ProjStatus: 2
    };

    client.GetProjects_Full(projectFullParams, (err, result) => {
      if (err) {
        logger.error('Error calling GetProjects_Full method:', err);
        return reject(err); 
      }

      const projects = result.GetProjects_FullResult.Project;

      if (projects && projects.length) {
        logger.info('Total number of projects: '+ projects.length);
        resolve(projects);
      } else {
        logger.info('No projects found.');
        resolve([]);
      }
    });
  });
}

module.exports = getProjects;
