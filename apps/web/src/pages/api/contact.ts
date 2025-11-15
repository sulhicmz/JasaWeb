// src/pages/api/contact.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const service = formData.get('service')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    // Validate required fields
    if (!name || !email || !service || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Semua field harus diisi',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Format email tidak valid',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Here you would typically send the email using a service like Nodemailer, SendGrid, etc.
    // NOTE: Email service integration should be implemented based on requirements
    // Options: Nodemailer, SendGrid, AWS SES, or other email service
    // For debugging purposes, you might want to log this in development only
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('Contact form submission:', {
        name,
        email,
        service,
        message,
      });
    }

    // Simulate email sending
    // In a real implementation, you would use an email service here
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `Pesan Kontak Baru: ${service}`,
      text: `
        Nama: ${name}
        Email: ${email}
        Layanan: ${service}
        Pesan: ${message}
      `,
      html: `
        <h2>Pesan Kontak Baru</h2>
        <p><strong>Nama:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Layanan:</strong> ${service}</p>
        <p><strong>Pesan:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });
    */

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Pesan Anda telah berhasil dikirim. Kami akan segera menghubungi Anda.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error in development for debugging
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('Error processing contact form:', error);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
