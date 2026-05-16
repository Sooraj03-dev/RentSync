import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: 'RentSync <reminders@rentsync.in>',
      to: 'delivered@resend.dev', // Resend's test email that always succeeds if the domain isn't verified
      subject: 'Rent due in 3 days — ₹18000',
      html: '<p>Hi Ramesh, your rent of ₹18000 is due on the 5th.</p>'
    });
    console.log("Email sent successfully:", data);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testEmail();
