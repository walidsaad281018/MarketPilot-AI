type SectionTitleProps = {
  title: string;
};

export default function SectionTitle({
  title,
}: SectionTitleProps) {
  return (
    <h2 className="mb-8 text-3xl font-bold text-slate-800">
      {title}
    </h2>
  );
}