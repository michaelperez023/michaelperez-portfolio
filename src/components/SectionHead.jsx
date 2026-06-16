import Reveal from "./Reveal";

export default function SectionHead({ index, title, lead }) {
  return (
    <Reveal className="section-head">
      <span className="section-index">{index}</span>
      <h2 className="section-title">{title}</h2>
      {lead && <p className="section-lead">{lead}</p>}
    </Reveal>
  );
}
