import * as vscode from 'vscode';
import * as express from 'express';

const stringLiteralP = `"(?:[^"\\\\]|\\\\.)*"|'(?:[^"\\\\]|\\\\.)*'`;
const toolRE = new RegExp(
	["tool", "\\(", stringLiteralP, ",", stringLiteralP, "\\)"]
	.map((p) => `(${p})`)
	.join("(\\s*)"),
	'g');

function addIndicesToGroups(match: RegExpMatchArray) {
	let index = match.index!;
	let results = [];
	for (let group of match.slice(1)) {
		results.push({text: group, index: index});
		index += group.length;
	}
	return results;
}

function matchToToolUse(match: RegExpMatchArray) {
	const withIndices = addIndicesToGroups(match);

	const idGroup = withIndices[4];
	const configGroup = withIndices[8];

	return {
		id: idGroup.text.slice(1, -1),
		config: configGroup.text.slice(1, -1),
		configRawIndex: configGroup.index,
	}
}

export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Running extension');

	const app = express();
	const port = 3000;

	app.get('/', (req, res) => {
		res.send("it works!");
	});

	app.get('/set', (req, res) => {
		const {id, config} = req.query;
		if (!id) {
			return res.status(400).send("missing `id` query param");
		}
		if (typeof(id) !== 'string') {
			return res.status(400).send("`id` query param not string? weird");
		}
		if (!config) {
			return res.status(400).send("missing `config` query param");
		}
		if (typeof(config) !== 'string') {
			return res.status(400).send("`config` query param not string? weird");
		}

		// TODO: modify non-active editors?
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return res.status(500).send("no active text editor");
		}

		let document = editor.document;
		const documentText = document.getText();
		const toolUses = [...documentText.matchAll(toolRE)].map(matchToToolUse);
		// TODO: multiple uses?
		const toolUse = toolUses.find((toolUse) => toolUse.id === id);
		if (!toolUse) {
			return res.status(500).send(`cannot find use of tool \`${id}\``);
		}
		const start = document.positionAt(toolUse.configRawIndex);
		const end = document.positionAt(toolUse.configRawIndex + toolUse.config.length + 2);
		// todo: encoding
		editor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(start, end), `"${config}"`);
		});
		res.status(200).send("success");
	});

	app.listen(port, () => {
		console.log(`Extension listening on port ${port}`);
	});
}

export function deactivate() {}
