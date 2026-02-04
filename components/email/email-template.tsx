interface EmailTemplateProps {
  otp: string;
  email: string;
}

export default function EmailTemplate({ otp, email }: EmailTemplateProps) {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#2a2a2a',
      color: '#fafafa'
    }}>
      <div style={{
        backgroundColor: '#353535',
        padding: '30px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          color: '#fafafa',
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Welcome!
        </h1>
        
        <p style={{
          color: '#999999',
          fontSize: '16px',
          lineHeight: '1.5',
          marginBottom: '20px'
        }}>
          Welcome to Platform1
          Thanks for your interest. Your verification code is:
        </p>
        
        <div style={{
          display: 'inline-block',
          backgroundColor: '#7c3aed',
          color: '#f3e8ff',
          padding: '16px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '24px',
          letterSpacing: '4px',
          marginBottom: '20px',
          fontFamily: 'monospace'
        }}>
          {otp}
        </div>
        
        <p style={{
          color: '#999999',
          fontSize: '14px',
          marginTop: '20px'
        }}>
          Enter this code on the verification page to complete your login.
        </p>
        
        <p style={{
          color: '#666666',
          fontSize: '14px',
          marginTop: '20px'
        }}>
          If you did not request this, you can safely ignore this email.
        </p>
        
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: '#666666'
        }}>
          <p>This email was sent to: {email}</p>
        </div>
      </div>
    </div>
  );
}