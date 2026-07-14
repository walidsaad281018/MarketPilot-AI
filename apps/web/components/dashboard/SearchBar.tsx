export default function SearchBar() {
  return (
    <div
      style={{
        marginBottom: "25px",
      }}
    >
      <input
        type="text"
        placeholder="Search Crypto, Stocks or ETFs..."
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "1px solid #CCC",
        }}
      />
    </div>
  );
}