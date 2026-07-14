export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-6">

      <h1 className="text-2xl font-bold text-blue-900">
        🚀 MarketPilot AI
      </h1>

      <div className="flex gap-8 text-slate-700">

        <a href="#">Dashboard</a>

        <a href="#">Crypto</a>

        <a href="#">Stocks</a>

        <a href="#">ETFs</a>

      </div>

    </nav>
  );
}