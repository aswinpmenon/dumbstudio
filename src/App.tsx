import { ExportedShader } from "./Shader"
import "./App.css"

export default function App() {
  return (
    <div className="page">
      <div className="shader">
        <ExportedShader />
      </div>

      <header className="nav">
        <span className="logo">dumb studio</span>
        <nav className="links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <footer className="foot">
        <span>© 2026 dumb studio</span>
        <span>Made with shaders</span>
      </footer>
    </div>
  )
}
