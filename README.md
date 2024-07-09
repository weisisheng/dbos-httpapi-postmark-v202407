# DBOS Http Api Endpoint --> Postmark email

This is a toy [DBOS app](https://docs.dbos.dev/) example focusing on remote deployment to DBOS Cloud (their hosted solution with a generous free tier for devs).

The repo sets up two simple HTTP API endpoints that: 1) sends an email using Postmark ESP when you hit `/sendemail/:friend/:content` endpoint and 2) inserts a record into a postgres d'base instance and retrieves the records when you visit the `/emails` endpoint.

## Prerequisites

1. Make sure you have node.js 21.x

2. Sign up for DBOS Cloud (https://www.dbos.dev/dbos-cloud)

3. Have a Postmark account, username / password from the server (https://postmarkapp.com/), and a specific sending email address setup

\*\*\*Since this uses nodemailer, you can easily swap out postmark for your email service provider of choice.

## Getting Started

1. Clone this repository and navigate to the project directory

2. Install the dependencies

**_*Be sure not to commit / hard code your secrets to a public repo! This setup is meant for local development and direct deployment to the dbos-cloud service.*_**

3. To deploy to DBOS-cloud, login with this, "**_npx dbos-cloud login_**" and follow the instructions to match the uuid given in the console to the one in the browser, then standard login user/password applies.

4. Next provision a d'base instance: "**_npx dbos-cloud db provision database-instance-name -U database-username_**"

5. Register your app with the d'base instance: "**_npx dbos-cloud app register -d database-instance-name_**"

6. To use secrets in DBOS, add your variables in the cli like this:

- export POSTMARK_USER=api-key-from-postmark-server-here
- export POSTMARK_PASSWORD=api-key-from-postmark-server-here
- export PGPASSWORD=put-the-password-you-created-when-you-setup-the-remote-database-here
- export SENDER_EMAIL=sender@foobar.com
- export RECIPIENT_EMAIL=receiver@foobar.com

These will be picked up at build time and inserted into the dbos-config.yaml fields: ${PGPASSWORD}, ${POSTMARK_USER}, ${POSTMARK_PASSWORD}, ${SENDER_EMAIL}, ${RECIPIENT_EMAIL} respectively.

7. And finally deploy your app: "**_npx dbos-cloud app deploy_**"

After a minute or two, you'll get back an api endpoint that looks like: `https://<username>-<app-name>.cloud.dbos.dev/`.

8. Test the endpoint:

First, visit `https://<username>-<app-name>.cloud.dbos.dev/sendemail/friend/content` replacing 'friend' and 'content' with your own choices. Hitting this sends an email to postmark and inserts a record into the d'base named 'postmark'.

Then visit `https://<username>-<app-name>.cloud.dbos.dev/emails` to retrieve the records from the d'base.

9. To delete the app online,`npx dbos-cloud app delete [application-name] --dropdb`. Remove the '--dropdb' parameter if you want to retain the database table.

## Some caveats:

- **The endpoint is not secure**, and anyone can send an email if they guess the assigned endpoint. You should add some sort of authentication to the endpoint to prevent abuse.

Here are some instructions for that: https://docs.dbos.dev/tutorials/authentication-authorization

- When building workflows with DBOS, consider creating the respective standalone functions, then wrapping them in an Httpapi decorator / function, then wrap all that in a @workflow which will add a bunch of cool built-in features.

-- granular observability
-- guaranteed only once execution
-- asynchronous execution
-- precise management and observability of workflows

There are so many more benefits to mention re: debugging, monitoring and overall speed, security, and costs which can be explored further here: https://docs.dbos.dev/

---

## Reference Docs (From Official Repo)

- To add more functionality to this application, modify `src/operations.ts`, then rebuild and redeploy it.
- For a detailed tutorial, check out our [programming quickstart](https://docs.dbos.dev/getting-started/quickstart-programming).
- To learn how to deploy your application to DBOS Cloud, visit our [cloud quickstart](https://docs.dbos.dev/getting-started/quickstart-cloud/)
- To learn more about DBOS, take a look at [our documentation](https://docs.dbos.dev/) or our [source code](https://github.com/dbos-inc/dbos-transact).
