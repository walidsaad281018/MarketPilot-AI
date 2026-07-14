type ButtonProps = {
  text: string;
};

export default function Button({ text }: ButtonProps) {
  return (
    <button className="rounded-lg bg-blue-900 px-8 py-3 text-white hover:bg-blue-800">
      {text}
    </button>
  );
}