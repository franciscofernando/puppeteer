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

try {
	cluster = config.clusters[process.argv.slice(2)[0]];
	if (!cluster) {
		throw 'cluster not found';
	}
	cluster = cluster.map(projectName => {
		if (config.projects[projectName]) {
			return projectName;
		} else {
			throw `project ${projectName} not found.`;
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

cluster.forEach(async projectName => {
	const projectConfig = config.projects[projectName];
	const child = spawn(projectConfig.script, [], {
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