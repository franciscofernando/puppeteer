const kill  = require('tree-kill');
const colors = require('colors/safe');
const { prompt } = require('prompts');
const clear = require('./clear');
const log = require('./log');

module.exports = (projects) => {
	const printLogs = (project) => {
		clear();
		let title = project.name;
			title = title.padStart((process.stdout.columns + project.name.length) / 2);
			title = title.padEnd(process.stdout.columns);
		console.log(colors.bgCyan(title));
		console.log('');
		
		project.logs.forEach((logData) => {
			log(project, logData);
		});
		project.active = true;
		projectSelect();
	};

	const onProjectClose = () => {
		Object.keys(projects).forEach((projectName) => {
			kill(projects[projectName].child.pid);
		});
		clear();
		console.log('All process has killed!');
	};

	const onProjectSelect = (questions, response, responses) => {
		if (response !== 'CLOSE') {
			Object.keys(projects).forEach((projectName) => {
				projects[projectName].active = false;
			});

			printLogs(response);
		} else {
			onProjectClose();
		}
	};

	const projectSelect = () => {
		process.stdin.removeAllListeners('keypress');
		if (process.stdin.isTTY) process.stdin.setRawMode(false);
		
		const options = Object.keys(projects).map((projectName) => {
			if (!projects[projectName].active) {
				return { 
					title: projectName, 
					description: 'Show logs.', 
					value: projects[projectName]
				};
			}
			return undefined;
		}).filter(item => !!item);

		prompt({
			type: 'select',
			name: 'project',
			message: options.length ? 'Select a project' : 'Select a option',
			choices: options.length ? options : [{ 
				title: 'Close', 
				description: 'Close all child process.', 
				value: 'CLOSE'
			}]
		}, {
			onCancel: onProjectClose, 
			onSubmit: onProjectSelect
		});
	};

	const logsHandler = (project) => (data) => {
		project.logs.push(data);
		if (project.active) {
			printLogs(project);
		}
	};

	Object.keys(projects).forEach((projectName) => {
		projects[projectName].child.stdout.on('data', logsHandler(projects[projectName]));
		/*projects[projectName].child.stdout.on('error', (e) => {
			console.log('ERROR', e);
		});
		projects[projectName].child.stdout.on('close', (e) => {
			console.log('CLOSE', e);
		});*/
	});

	projectSelect();
};