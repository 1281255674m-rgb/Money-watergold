import { ImageUp, Plus, Save, Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getAdminToken } from "../../lib/adminSession";
import type { SiteContent } from "../../types";

export function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const token = getAdminToken();

  useEffect(() => { api.getAdminContent(token).then(setContent).catch((error) => setMessage(error instanceof Error ? error.message : "内容加载失败")); }, []);

  if (!content) return <div className="admin-loading">正在加载网站内容…</div>;

  const save = async () => {
    setSaving(true); setMessage("");
    try { setContent(await api.saveContent(token, content)); setMessage("网站内容已发布"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
    finally { setSaving(false); }
  };

  const uploadQr = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "contactQrUrl" | "personalContactQrUrl",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setMessage("请选择5MB以内的图片文件"); return; }
    setMessage("正在上传二维码…");
    try { const url = await api.uploadAsset(token, file, "qr"); setContent({ ...content, [field]: url }); setMessage("二维码已上传，保存后发布"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "上传失败"); }
  };

  return (
    <>
      <div className="admin-page-heading"><div><p className="eyebrow">网站内容</p><h1>品牌与招募内容</h1></div><button className="button primary" type="button" onClick={() => void save()} disabled={saving}><Save size={17} />{saving ? "保存中…" : "保存并发布"}</button></div>
      {message && <div className={message.includes("失败") ? "admin-error" : "admin-message"}>{message}</div>}
      <div className="content-editor">
        <section className="editor-section"><div className="editor-section-head"><span>01</span><div><h2>品牌首屏</h2><p>控制页头 Logo、首页标题和品牌说明。</p></div></div><div className="form-grid two-columns"><label className="field"><span>品牌名称</span><input value={content.brandName} onChange={(e) => setContent({ ...content, brandName: e.target.value })} maxLength={24} /></label><label className="field"><span>Logo 英文副标题</span><input value={content.brandTagline} onChange={(e) => setContent({ ...content, brandTagline: e.target.value })} maxLength={36} placeholder="例如 HAOXING TECHNOLOGY" /></label></div><label className="field"><span>宣传语</span><input value={content.slogan} onChange={(e) => setContent({ ...content, slogan: e.target.value })} /></label><label className="field"><span>首屏标签</span><input value={content.heroEyebrow} onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })} /></label><label className="field"><span>首屏介绍</span><textarea value={content.heroDescription} onChange={(e) => setContent({ ...content, heroDescription: e.target.value })} /></label><div className="form-grid two-columns"><label className="field"><span>招募标题</span><input value={content.recruitmentTitle} onChange={(e) => setContent({ ...content, recruitmentTitle: e.target.value })} /></label><label className="field"><span>公司页脚名称</span><input value={content.companyName} onChange={(e) => setContent({ ...content, companyName: e.target.value })} /></label></div><label className="field"><span>招募说明</span><textarea value={content.recruitmentDescription} onChange={(e) => setContent({ ...content, recruitmentDescription: e.target.value })} /></label></section>

        <section className="editor-section">
          <div className="editor-section-head"><span>02</span><div><h2>首页合伙邀请</h2><p>管理首访用户看到的代理须知弹窗。</p></div></div>
          <label className="setting-toggle"><input type="checkbox" checked={content.invitationEnabled} onChange={(e) => setContent({ ...content, invitationEnabled: e.target.checked })} /><span><strong>启用邀请弹窗</strong><small>关闭后首页不再自动展示</small></span></label>
          <label className="field"><span>邀请标题</span><input value={content.invitationTitle} onChange={(e) => setContent({ ...content, invitationTitle: e.target.value })} maxLength={80} /></label>
          <label className="field"><span>邀请正文</span><textarea className="invitation-editor-textarea" value={content.invitationBody} onChange={(e) => setContent({ ...content, invitationBody: e.target.value })} maxLength={900} /></label>
        </section>

        <section className="editor-section">
          <div className="editor-section-head"><span>03</span><div><h2>微信联系方式</h2><p>分别管理私人微信和企业微信，至少保留一种联系方式。</p></div></div>
          <div className="contact-editor-grid">
            <div className="qr-editor">
              <div className="qr-preview">{content.personalContactQrUrl ? <img src={content.personalContactQrUrl} alt="私人微信二维码预览" /> : <span>尚未上传</span>}</div>
              <div>
                <label className="field"><span>私人微信标签</span><input value={content.personalContactLabel} onChange={(e) => setContent({ ...content, personalContactLabel: e.target.value })} /></label>
                <label className="button secondary upload-button"><ImageUp size={17} />替换私人微信<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadQr(event, "personalContactQrUrl")} /></label>
                {content.personalContactQrUrl && <button className="text-danger" type="button" onClick={() => setContent({ ...content, personalContactQrUrl: "" })}>移除二维码</button>}
              </div>
            </div>
            <div className="qr-editor">
              <div className="qr-preview">{content.contactQrUrl ? <img src={content.contactQrUrl} alt="企业微信二维码预览" /> : <span>尚未上传</span>}</div>
              <div>
                <label className="field"><span>企业微信标签</span><input value={content.contactLabel} onChange={(e) => setContent({ ...content, contactLabel: e.target.value })} /></label>
                <label className="button secondary upload-button"><ImageUp size={17} />替换企业微信<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadQr(event, "contactQrUrl")} /></label>
                {content.contactQrUrl && <button className="text-danger" type="button" onClick={() => setContent({ ...content, contactQrUrl: "" })}>移除二维码</button>}
              </div>
            </div>
          </div>
        </section>

        <section className="editor-section"><div className="editor-section-head"><span>04</span><div><h2>业务介绍</h2><p>调整首页和服务页中的业务标题与说明。</p></div></div><div className="editable-list">{content.services.map((service, index) => <div className="editable-row" key={service.id}><strong>{String(index + 1).padStart(2, "0")} · {service.shortTitle}</strong><label className="field"><span>完整标题</span><input value={service.title} onChange={(e) => setContent({ ...content, services: content.services.map((item) => item.id === service.id ? { ...item, title: e.target.value } : item) })} /></label><label className="field"><span>一句话说明</span><textarea value={service.summary} onChange={(e) => setContent({ ...content, services: content.services.map((item) => item.id === service.id ? { ...item, summary: e.target.value } : item) })} /></label><label className="field"><span>服务细项（每行一项）</span><textarea value={service.details.join("\n")} onChange={(e) => setContent({ ...content, services: content.services.map((item) => item.id === service.id ? { ...item, details: e.target.value.split("\n").filter(Boolean) } : item) })} /></label></div>)}</div></section>

        <section className="editor-section"><div className="editor-section-head"><span>05</span><div><h2>规则与常见问题</h2><p>只展示合作概览，不在这里公布未经确认的佣金细则。</p></div></div><h3 className="editor-subtitle">规则概览</h3><div className="editable-list compact-list">{content.rules.map((rule, index) => <div className="editable-row" key={`${rule.title}-${index}`}><label className="field"><span>标题</span><input value={rule.title} onChange={(e) => setContent({ ...content, rules: content.rules.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) })} /></label><label className="field"><span>说明</span><textarea value={rule.description} onChange={(e) => setContent({ ...content, rules: content.rules.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item) })} /></label></div>)}</div><h3 className="editor-subtitle">常见问题</h3><div className="editable-list compact-list">{content.faqs.map((faq, index) => <div className="editable-row faq-edit-row" key={`${faq.question}-${index}`}><label className="field"><span>问题</span><input value={faq.question} onChange={(e) => setContent({ ...content, faqs: content.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, question: e.target.value } : item) })} /></label><label className="field"><span>回答</span><textarea value={faq.answer} onChange={(e) => setContent({ ...content, faqs: content.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, answer: e.target.value } : item) })} /></label><button className="icon-button danger-icon" type="button" onClick={() => setContent({ ...content, faqs: content.faqs.filter((_, itemIndex) => itemIndex !== index) })} aria-label="删除该问题"><Trash2 size={17} /></button></div>)}</div><button className="button secondary" type="button" onClick={() => setContent({ ...content, faqs: [...content.faqs, { question: "新问题", answer: "请填写回答。" }] })}><Plus size={17} />新增问题</button></section>

        <section className="editor-section"><div className="editor-section-head"><span>06</span><div><h2>公开真实数据</h2><p>只有勾选“已核实”并填写数值的数据才会出现在首页。</p></div></div><div className="editable-list compact-list">{content.publicMetrics.map((metric, index) => <div className="metric-edit-row" key={metric.id}><label className="field"><span>数值</span><input value={metric.value} onChange={(e) => setContent({ ...content, publicMetrics: content.publicMetrics.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item) })} /></label><label className="field"><span>说明</span><input value={metric.label} onChange={(e) => setContent({ ...content, publicMetrics: content.publicMetrics.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) })} /></label><label className="verify-checkbox"><input type="checkbox" checked={metric.verified} onChange={(e) => setContent({ ...content, publicMetrics: content.publicMetrics.map((item, itemIndex) => itemIndex === index ? { ...item, verified: e.target.checked } : item) })} />已核实</label><button className="icon-button danger-icon" type="button" onClick={() => setContent({ ...content, publicMetrics: content.publicMetrics.filter((_, itemIndex) => itemIndex !== index) })} aria-label="删除数据"><Trash2 size={17} /></button></div>)}</div><button className="button secondary" type="button" onClick={() => setContent({ ...content, publicMetrics: [...content.publicMetrics, { id: crypto.randomUUID(), label: "已覆盖高校", value: "", verified: false }] })}><Plus size={17} />新增公开数据</button></section>
      </div>
    </>
  );
}
