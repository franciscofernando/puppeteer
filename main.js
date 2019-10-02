const fs = require('fs');
const { spawn } = require('child_process');

const { projectSelector } = require('./utils');

let config;
let cluster;

try {
	config = JSON.parse(fs.readFileSync('./config.json').toString());
} catch (e) {
	console.log('config.json not exist, try clone config.template.json');
	return;
}

const { projects: projectsConfigs, clusters } = config;

try {
	cluster = clusters[process.argv.slice(2)[0]];
	if (!cluster) {
		throw 'cluster not found';
	}
	cluster = cluster.map(projectInstruction => {
		const [projectName, projectScriptName] = projectInstruction.split(/\:/g);
		
		if (projectsConfigs[projectName]) {
			if (projectsConfigs[projectName].scripts[projectScriptName]) {
				return { projectName, projectScriptName };				
			} else {
				throw `script ${projectScriptName} of project ${projectScriptName} not found.`;
			}
		} else {
			throw `project ${projectScriptName} not found.`;
		}
	});
} catch(e) {
	const clusterName = process.argv.slice(2);

	if (clusterName && clusterName.length) {
		console.log(`Cluster ${clusterName[0]} not found.`);
	} else {
		console.log(`Try yarn start CLUSTERNAME or npm start CLUSTERNAME.`);
	}
	return;
}

const projects = {};

cluster.forEach(async ({ projectName, projectScriptName }) => {
	const projectConfig = projectsConfigs[projectName];
	const child = spawn(projectConfig.scripts[projectScriptName], [], {
		cwd: projectConfig.path,
		shell: true
	});

	projects[projectName] = {
		child,
		name: projectName,
		logs: [],
		active: false
	};
});

projectSelector(projects);