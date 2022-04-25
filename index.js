const core = require('@actions/core');
const { 
    SESClient,
    UpdateTemplateCommand,
    CreateTemplateCommand,
    GetTemplateCommand
} = require('@aws-sdk/client-ses');
const fs = require('fs');

async function run() {
    try {
        // Grab the templates directory location from the input
        const templatesDir = core.getInput('templates');

        // GitHub should validate this because it's required, but just to be safe!
        if (!templatesDir) {
            core.setFailed('no templates directory provided');
            return;
        }

        // Create a new SES Client, taking credentials from aws-actions/configure-aws-credentials
        const client = new SESClient();

        // Read each file in the directory
        fs.readdirSync(templatesDir).forEach((name) => {
            // Parse the JSON from the file
            const file = JSON.parse(fs.readFileSync(`${templatesDir}/${name}`));

            // First, figure out if we have a template
            client.send(new GetTemplateCommand({TemplateName: file.Template.TemplateName})).then(() => {
                // We have a template! Update it

                client.send(new UpdateTemplateCommand({
                    Template: file.Template
                })).then(() => {
                    core.notice(`Updated template: ${file.Template.TemplateName} (${name})`);
                }).catch((error) => {
                    core.setFailed(error.message);
                });
            }).catch((error) => {
                client.send(new CreateTemplateCommand({
                    Template: file.Template
                })).then(() => {
                    core.notice(`Created template: ${file.Template.TemplateName} (${name})`);
                }).catch((error) => {
                    core.setFailed(error.message);
                });
            })
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();