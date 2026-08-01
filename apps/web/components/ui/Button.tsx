import Link from "next/link";

type ButtonProps = {
  text: string;
  href?: string;
};

export default function Button({
  text,
  href = "#",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-8 py-4 font-bold text-white transition hover:bg-blue-800"
    >
      {text}
    </Link>
  );
}