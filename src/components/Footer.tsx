import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-[#161617] text-[#a1a1a6] text-xs mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10 border-b border-white/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <p className="text-white font-semibold mb-3 text-sm font-['Sora']">Tienda</p>
            <ul className="space-y-2">
              <li><Link to="/catalogo?tipo=iPhone" className="hover:text-white transition-colors">iPhone</Link></li>
              <li><Link to="/catalogo?tipo=Mac" className="hover:text-white transition-colors">Mac</Link></li>
              <li><Link to="/catalogo?tipo=iPad" className="hover:text-white transition-colors">iPad</Link></li>
              <li><Link to="/catalogo" className="hover:text-white transition-colors">Ver todo</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3 text-sm font-['Sora']">Condicion</p>
            <ul className="space-y-2">
              <li><Link to="/catalogo?condicion=__nuevo__" className="hover:text-white transition-colors">Nuevos</Link></li>
              <li><Link to="/catalogo?condicion=__usado__" className="hover:text-white transition-colors">Usados certificados</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold mb-3 text-sm font-['Sora']">Contacto</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/5491100000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="brand-heading text-white text-2xl font-bold mb-2">Pixel</p>
            <p className="text-[#6e6e73] leading-relaxed">
              Dispositivos Apple reacondicionados con calidad validada.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#6e6e73]">
        <p>Copyright &copy; {new Date().getFullYear()} Pixel. Todos los derechos reservados.</p>
        <p>Buenos Aires, Argentina</p>
      </div>
    </footer>
  );
}
