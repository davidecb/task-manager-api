const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    
    sgMail.send({
        to: email,
        from: 'davidecobaez@gmail.com',
        subject: `Welcome ${name}, thanks for join!!`,
        text: `Welcome ${name}, We are happy of your submit, feel free exploring the app`
    })
}

const sendGoodByeEmail = (email, name) => {
    
    sgMail.send({
        to: email,
        from: 'davidecobaez@gmail.com',
        subject: 'We are sorry to see you leave us',
        text: `Good bye ${name}, We hope to see you again very soon.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}
