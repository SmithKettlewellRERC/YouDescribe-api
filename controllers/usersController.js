const conf = require("../shared/config")();
const apiMessages = require("./../shared/apiMessages");
const nodeMailer = require("nodemailer");
const User = require("./../models/user");
const AudioDescription = require("./../models/audioDescription");
const UserVotes = require("./../models/userVotes");

const sendEmailByNodeMailer = (emailAddress, emailBody) => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: conf.nodeMailerAuthUser,
      clientId:
        "1061361249208-9799kv6172rjgmk4gad077639dfrck82.apps.googleusercontent.com",
      clientSecret: "emqt6gfCSMNlhHfpADZCEgqf",
      refreshToken:
        "1//04G0CRHoEeHbCCgYIARAAGAQSNwF-L9IrDLVaWgtTRx14lUgXKHIiiZLqTt_63ocFkF22VOCGXdkCrci56XYmPCmK19yo_Bhr64w",
      accessToken:
        "ya29.a0AfH6SMCl2PFRyEO_6KZi6-o4aJBGtz3aXDPPEmjIC1w3BmMfqSWZIl0tRgqvEzXhAbwCydclQNQa-5dY5BehpQICTz7ypprurpDGwmHZ9J2lD6clRVkpFrgoX-al4-TGmamhYACN78ZZ3WDMEgBDO-j_vc3n3MWbvwGq-2X_3tk"
    }
  });
  const mailOptions = {
    from: conf.nodeMailerAuthUser,
    to: emailAddress,
    subject: "Notification From YouDescribe",
    text: emailBody
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(
        "email sent to: " + emailAddress + "; response:" + info.response
      );
    }
  });
};

const usersController = {
  getOne: (req, res) => {
    const userId = req.params.userId;
    User.findOne({ _id: userId }).exec((errGetOne, user) => {
      if (errGetOne) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (user) {
        const ret = apiMessages.getResponseByCode(1014);
        ret.result = user;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(65);
        res.status(ret.status).json(ret);
      }
    });
  },

  updateOptIn: (req, res) => {
    const id = req.body.id;
    const optInChoices = req.body.choices;
    const optIn = [];
    for (var i in optInChoices) {
      if (optInChoices[i]) {
        optIn.push(parseInt(i));
      }
    }
    const toUpdate = {
      opt_in: optIn,
      policy_review: "reviewed"
    };
    User.findOneAndUpdate({ _id: id }, { $set: toUpdate }, { new: true }).exec(
      (err, ac) => {
        const ret = { status: 200 };
        ret.result = {};
        res.status(ret.status).json(ret);
      }
    );
  },

  sendOptInEmail: (req, res) => {
    const optIn = parseInt(req.body.optin);
    const id = req.body.id;
    const emailBody = req.body.emailbody;
    const query =
      optIn == 0
        ? UserVotes.find({ youtube_id: id })
        : AudioDescription.find({ _id: id });
    query.exec((err, results) => {
      results.forEach(result => {
        User.findOne({
          _id: result.user,
          opt_in: { $elemMatch: { $eq: optIn } }
        }).exec((err, user) => {
          if (user) {
            const emailAddress = user.email;
            sendEmailByNodeMailer(emailAddress, emailBody);
          }
        });
      });
      const ret = { status: 200 };
      ret.info =
        "User will receive the notification if s/he has chosen to opt in.";
      res.status(ret.status).json(ret);
    });
  },

  sendVideoRemappingEmail: (req, res) => {},

  sendVideoIndexerEmail: (req, res) => {
    const id = req.body.id;
    const delay = req.body.delay || 30;
    const emailBody = req.body.emailbody;
    User.findOne({ _id: id }).exec((err, user) => {
      setTimeout(function() {
        const emailAddress = user.email;
        sendEmailByNodeMailer(emailAddress, emailBody);
      }, 1000 * 60 * delay);
      const ret = { status: 200 };
      ret.info = `User will receive the notification after ${delay} min.`;
      res.status(ret.status).json(ret);
    });
  },

  sendMail: (req, res) => {
    //for testing!
    const email = req.body.email;
    const body = req.body.mailbody;
    console.log(req.body);
    sendEmailByNodeMailer(email, body);
    res.send();
  }
};

module.exports = usersController;
