export default function Home() {
  return (
    <main>
      <div className="header">
        <h1>Welcome to Contentstack</h1>
        <p>Power your digital experiences with Contentstack</p>
      </div>
      <div className="container">
        <img
          src="https://images.contentstack.io/v3/assets/blt7359e2a55efae483/blt518e5105a0686696/663e30a08f19535905e50af2/Logo.svg"
          alt="Contentstack Logo" className="logo" />
        <div className="content">
          <h2>Learn More</h2>
          <ul>
            <li><a href="https://www.contentstack.com/platforms/launch" target="_blank">Contentstack Launch</a></li>
            <li><a href="https://www.contentstack.com/docs/developers/launch/edge-functions" target="_blank">Contentstack Launch Edge Functions</a></li>
          </ul>
        </div>
      </div>
      <div className="footer">
        <p>&copy; 2024 Contentstack. All rights reserved.</p>
      </div>
    </main>
  );
}
