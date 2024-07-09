import {
  TransactionContext,
  Transaction,
  GetApi,
  PostApi,
  CommunicatorContext,
  Communicator,
  WorkflowContext,
  Workflow,
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";
//
import nodemailer, {
  TransportOptions,
  SendMailOptions,
  SentMessageInfo,
} from "nodemailer";
// this is a secondary logger setup specific to  nodemailer
// it can likely be removed for simplicity
import winston from "winston";

import { v4 as uuidv4 } from "uuid";

// ditto on nodemailer logger comments above
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface postmark_email {
  friend: string;
  content: string;
}

export class Greeting {
  // this is the decorator and function setup for the database insert post the email
  @Transaction()
  static async HelloTransaction(
    ctxt: TransactionContext<Knex>,
    friend: string,
    content: string
  ) {
    // creates a uuid as primary key
    const uid = uuidv4();

    (await ctxt.client.raw(
      "INSERT INTO postmark (uid, friend, content) VALUES (?, ?, ?)",
      [uid, friend, content]
    )) as { rows: postmark_email[] };
    // ctxt.logger.info(rows);
    //
    return `Event inserted into the database: ${friend}--${content}`;
  }

  // this is the decorator and function setup for the email send
  // this wrapper is used for connecting with 3rd party services
  @Communicator()
  static async SendGreetingEmail(
    ctxt: CommunicatorContext,
    friend: string,
    content: string
  ) {
    ctxt.logger.info(`Sending email "${content}" to ${friend}...`);
    //
    const transporter = nodemailer.createTransport({
      host: "smtp.postmarkapp.com",
      port: 587,
      secure: false,
      requireTLS: false,
      auth: {
        user: process.env.POSTMARK_USER,
        pass: process.env.POSTMARK_PASSWORD,
      },
    } as TransportOptions);

    const mailOptions: SendMailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Test Email",
      html: `<h1>Hello ${friend}.  Here is the email with the ${content}</h1>`,
    };

    // this is a secondary logger setup for nodemailer
    logger.info(`Sending mail to - ${process.env.RECIPIENT_EMAIL}`);
    transporter.sendMail(
      mailOptions,
      (error: Error | null, info: SentMessageInfo) => {
        if (error) {
          logger.error(error);
        } else {
          logger.info("Email sent: " + info);
        }
      }
    );
    // this will show up in the monitoring dashboard
    // https://docs.dbos.dev/cloud-tutorials/monitoring-dashboard
    ctxt.logger.info("Email sent!");
    return "Email sent!";
  }

  // here is the standalone api endpoint set up to 'get' the d'base entry after the workflow (below) has completed
  @GetApi("/emails")
  // this wrapper is used for d'base operations
  @Transaction()
  static async ViewTransaction(
    ctxt: TransactionContext<Knex>
  ): Promise<string | string[] | null> {
    const rows = (await ctxt.client.raw("SELECT * FROM postmark")) as {
      rows: [string];
    };
    ctxt.logger.info(rows.rows);
    return rows.rows;
  }

  // here is the final function which ties the workflow all together and sets up an api endpoint to post to

  @Workflow()
  @PostApi("/sendemail/:friend/:content")
  static async GreetingWorkflow(
    ctxt: WorkflowContext,
    friend: string,
    content: string
  ) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greeting).SendGreetingEmail(friend, content);
    await ctxt.invoke(Greeting).HelloTransaction(friend, content);
    ctxt.logger.info(`Greeting sent to ${friend}, with this ${content}!`);
    return noteContent;
  }
}
