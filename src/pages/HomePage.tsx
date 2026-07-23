import { ArrowRight, CheckCircle2, Compass, Link2, MessageCircle, ShieldCheck } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { ContactChannels } from "../components/ContactChannels";
import type { PublicOutletContext } from "../components/PublicLayout";
import { SectionHeading } from "../components/SectionHeading";
import { ServiceIcon } from "../components/ServiceIcon";
import { WelcomeInvitationDialog } from "../components/WelcomeInvitationDialog";
import { useSiteContent } from "../context/SiteContentContext";

export function HomePage() {
  const { content } = useSiteContent();
  const { openContact } = useOutletContext<PublicOutletContext>();
  const hasContact = Boolean(content.contactQrUrl || content.personalContactQrUrl);
  const verifiedMetrics = content.publicMetrics.filter((metric) => metric.verified && metric.value.trim());

  return (
    <>
      <section className="hero-section">
        <img className="hero-image" src="/hero-campus.png" alt={`校园建筑、学生与连接路径构成的${content.brandName}品牌场景`} />
        <div className="hero-overlay" />
        <div className="hero-content page-width">
          <div className="hero-copy-column">
            <p className="eyebrow hero-eyebrow">{content.heroEyebrow}</p>
            <h1>{content.brandName}</h1>
            <p className="hero-slogan">{content.slogan}</p>
            <p className="hero-copy">{content.heroDescription}</p>
            <div className="hero-actions">
              <Link className="button primary" to="/apply">申请成为校园代理<ArrowRight size={18} /></Link>
            </div>
          </div>
          {hasContact && (
            <aside className="hero-contact-panel">
              <p className="eyebrow">微信联系</p>
              <h2>建议先加私人微信</h2>
              <p>先简单沟通学校和想法，确认合作意向后再邀请进入企业微信。</p>
              <ContactChannels
                variant="hero"
                enterpriseQrUrl={content.contactQrUrl}
                enterpriseLabel={content.contactLabel}
                personalQrUrl={content.personalContactQrUrl}
                personalLabel={content.personalContactLabel}
              />
            </aside>
          )}
        </div>
      </section>

      {hasContact && (
        <section className="home-mobile-contact">
          <div className="page-width">
            <p className="eyebrow">微信联系</p>
            <h2>建议先加私人微信</h2>
            <p>先简单沟通学校和想法，确认合作意向后再邀请进入企业微信。</p>
            <ContactChannels
              variant="hero"
              enterpriseQrUrl={content.contactQrUrl}
              enterpriseLabel={content.contactLabel}
              personalQrUrl={content.personalContactQrUrl}
              personalLabel={content.personalContactLabel}
            />
          </div>
        </section>
      )}

      <section className="trust-strip">
        <div className="page-width trust-grid">
          <div><Compass size={20} /><span>面向山东高校</span></div>
          <div><Link2 size={20} /><span>连接真实需求</span></div>
          <div><ShieldCheck size={20} /><span>明确服务边界</span></div>
          <div><MessageCircle size={20} /><span>微信持续沟通</span></div>
        </div>
      </section>

      {verifiedMetrics.length > 0 && (
        <section className="metrics-band">
          <div className="page-width metrics-grid">
            {verifiedMetrics.map((metric) => (
              <div key={metric.id}><strong>{metric.value}</strong><span>{metric.label}</span></div>
            ))}
          </div>
        </section>
      )}

      <section className="section page-width" id="services">
        <SectionHeading eyebrow="业务方向" title="从校园里的真实需求出发">
          <p>我们不要求代理推销固定商品。你负责发现和连接，我们负责认真理解并承接。</p>
        </SectionHeading>
        <div className="service-index">
          {content.services.map((service, index) => (
            <article className="service-index-row reveal" key={service.id}>
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="service-symbol"><ServiceIcon icon={service.icon} size={27} /></div>
              <div>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
              </div>
              <Link to={`/services#${service.id}`} aria-label={`查看${service.title}`}><ArrowRight size={20} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section recruitment-band" id="campus-plan">
        <div className="page-width recruitment-layout">
          <div className="recruitment-copy reveal">
            <p className="eyebrow">校园代理计划</p>
            <h2>{content.recruitmentTitle}</h2>
            <p>{content.recruitmentDescription}</p>
            <Link className="text-link" to="/apply">提交代理报名<ArrowRight size={17} /></Link>
          </div>
          <div className="role-list">
            {[
              ["观察", "留意身边真实、明确、可沟通的需求。"],
              ["连接", "把有需求的同学介绍给负责人。"],
              ["共创", "提出本校的新场景和合作想法。"],
            ].map(([title, description]) => (
              <div className="role-item reveal" key={title}>
                <CheckCircle2 size={22} />
                <div><h3>{title}</h3><p>{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-width">
        <SectionHeading eyebrow="合作流程" title="简单、清楚、每一步可确认" />
        <ol className="process-list">
          {["了解项目", "提交报名", "私人微信沟通", "确认合作与编号", "进入企业微信"].map((item, index) => (
            <li className="reveal" key={item}><span>{index + 1}</span><strong>{item}</strong></li>
          ))}
        </ol>
      </section>

      <section className="section rules-band">
        <div className="page-width">
          <SectionHeading eyebrow="规则概览" title="把重要的事情说在前面">
            <p>具体合作比例与结算方式将在沟通确认后执行，网站暂不展示未经确认的细则。</p>
          </SectionHeading>
          <div className="rules-grid">
            {content.rules.map((rule, index) => (
              <article className="rule-item reveal" key={rule.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{rule.title}</h3>
                <p>{rule.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-width co-create-section">
        <div className="co-create-copy reveal">
          <p className="eyebrow">校园共创</p>
          <h2>每所学校，都可能有一个值得认真做的需求</h2>
          <p>回收、学习、规划之外，如果你更了解本校的真实问题，欢迎把想法写进报名。我们愿意一起讨论、验证和完善。</p>
          <Link className="button secondary" to="/apply">写下你的想法<ArrowRight size={18} /></Link>
        </div>
        <div className="connection-visual" aria-hidden="true">
          <span className="node node-a" /><span className="node node-b" /><span className="node node-c" />
          <span className="route route-a" /><span className="route route-b" />
          <img src="/logo-mark.svg" alt="" />
        </div>
      </section>

      <section className="section faq-section page-width">
        <SectionHeading eyebrow="常见问题" title="报名前，你可能想知道" />
        <div className="faq-list">
          {content.faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>{faq.question}<span>+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="page-width final-cta-inner">
          <div><p className="eyebrow">现在开始</p><h2>从你所在的学校，建立第一条连接</h2></div>
          <Link className="button light" to="/apply">申请成为校园代理<ArrowRight size={18} /></Link>
        </div>
      </section>

      <WelcomeInvitationDialog
        enabled={content.invitationEnabled}
        brandName={content.brandName}
        title={content.invitationTitle}
        body={content.invitationBody}
        onChat={openContact}
        onExplore={() => document.getElementById("campus-plan")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

    </>
  );
}
