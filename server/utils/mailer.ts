const sgMail = require('@sendgrid/mail')

const ProcessUtils = require('../../core/processUtils')
const i18nFactory = require('../../core/i18n/i18nFactory')

sgMail.setApiKey(ProcessUtils.ENV.sendGridApiKey)

const sendEmail = async (to, msgKey, msgParams = {}, lang) => {
  const i18n = await i18nFactory.createI18nPromise(lang)

  const from = ProcessUtils.ENV.adminEmail
  const subject = i18n.t(`${msgKey}.subject`)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  await sgMail.send({
    to,
    from,
    subject,
    html,
  })
}

module.exports = {
  sendEmail,
}
