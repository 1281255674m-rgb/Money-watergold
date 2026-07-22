import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { useSiteContent } from "../context/SiteContentContext";

export function ServicesPage() {
  const { content } = useSiteContent();
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="page-width">
          <p className="eyebrow">服务方向</p>
          <h1>回应校园里的真实需求</h1>
          <p>从毕业季到升学规划，我们以清楚的边界、直接的沟通和可确认的过程提供服务。</p>
        </div>
      </section>
      <section className="section page-width service-detail-list">
        {content.services.map((service, index) => (
          <article id={service.id} className="service-detail reveal" key={service.id}>
            <div className="service-detail-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="service-detail-icon"><ServiceIcon icon={service.icon} size={34} /></div>
            <div className="service-detail-copy">
              <h2>{service.title}</h2>
              <p>{service.summary}</p>
              <ul>{service.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            </div>
          </article>
        ))}
      </section>
      <section className="compliance-note">
        <div className="page-width compliance-inner">
          <ShieldCheck size={28} />
          <div><h2>学习服务边界</h2><p>仅提供答疑、方法辅导、资料整理和展示优化，不提供代写、替考或虚假学术材料。</p></div>
          <Link className="text-link" to="/apply">成为校园代理<ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  );
}
