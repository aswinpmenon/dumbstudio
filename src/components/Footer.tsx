export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__mark">dumb studio</div>
          <div className="footer__cols">
            <div className="footer__col">
              <h4>Sitemap</h4>
              <a href="#services">Services</a>
              <a href="#process">Process</a>
              <a href="#studio">Studio</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer__col">
              <h4>Social</h4>
              <a href="#">Instagram</a>
              <a href="#">X / Twitter</a>
              <a href="#">GitHub</a>
              <a href="#">LinkedIn</a>
            </div>
            <div className="footer__col">
              <h4>Contact</h4>
              <a href="mailto:hello@dumbstud.io">hello@dumbstud.io</a>
              <p>Remote-first</p>
              <p>Worldwide</p>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 dumb studio</span>
          <span>Web &amp; app development</span>
          <span>Made in the dark</span>
        </div>
      </div>
    </footer>
  )
}
