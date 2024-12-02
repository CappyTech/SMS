function getProjects(client) {
  return new Promise((resolve, reject) => {
    const projectFullParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      ProjStatus: 2
    };

    client.GetProjects_Full(projectFullParams, (err, result) => {
      if (err) {
        console.error('Error calling GetProjects_Full method:', err);
        return reject(err); 
      }

      const projects = result.GetProjects_FullResult.Project;

      if (projects && projects.length) {
        console.log('Total number of projects:', projects.length);
        resolve(projects);
      } else {
        console.log('No projects found.');
        resolve([]);
      }
    });
  });
}

module.exports = getProjects;
