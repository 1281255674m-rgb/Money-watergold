import { AlertCircle, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContactChannels } from "../components/ContactChannels";
import { useSiteContent } from "../context/SiteContentContext";
import { GRADES, SHANDONG_SCHOOLS } from "../data/schools";
import { api } from "../lib/api";
import { getSessionId, getSource } from "../lib/analytics";
import type { ApplicantGrade, ApplicationInput } from "../types";

const initialForm: ApplicationInput = {
  school: "",
  grade: "大一",
  wechatId: "",
  phone: "",
  interests: [],
  ideas: "",
  privacyAccepted: false,
  source: "direct",
  website: "",
};

export function ApplyPage() {
  const { content } = useSiteContent();
  const [form, setForm] = useState<ApplicationInput>(initialForm);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const markStarted = () => {
    if (started) return;
    setStarted(true);
    void api.trackEvent({ name: "application_start", path: "/apply", source: getSource(), sessionId: getSessionId() }).catch(() => undefined);
  };

  const toggleInterest = (id: string) => {
    markStarted();
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(id)
        ? current.interests.filter((interest) => interest !== id)
        : [...current.interests, id],
    }));
  };

  const validate = (): string => {
    if (form.school.trim().length < 2) return "请填写学校名称";
    if (form.wechatId.trim().length < 3) return "请填写有效的微信号";
    if (form.phone && !/^1\d{10}$/.test(form.phone.trim())) return "备用手机号格式不正确";
    if (form.interests.length === 0) return "请至少选择一个感兴趣的业务方向";
    if (!form.privacyAccepted) return "请阅读并同意隐私说明";
    return "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await api.submitApplication({ ...form, source: getSource() });
      setSuccess(true);
      void api.trackEvent({ name: "application_submit", path: "/apply", source: getSource(), sessionId: getSessionId() }).catch(() => undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="application-success page-width">
        <CheckCircle2 size={48} />
        <p className="eyebrow">报名已提交</p>
        <h1>我们已经收到你的信息</h1>
        <p>报名信息会进入“待联系”状态。建议先添加私人微信并备注学校，确认合作意向后由负责人邀请你进入企业微信。</p>
        {(content.contactQrUrl || content.personalContactQrUrl) && (
          <div className="success-contact-panel">
            <div className="success-contact-heading"><MessageCircle size={20} /><div><strong>下一步：添加微信</strong><span>推荐先添加私人微信</span></div></div>
            <ContactChannels
              variant="success"
              enterpriseQrUrl={content.contactQrUrl}
              enterpriseLabel={content.contactLabel}
              personalQrUrl={content.personalContactQrUrl}
              personalLabel={content.personalContactLabel}
            />
          </div>
        )}
        <div className="success-actions">
          <Link className="button primary" to="/">返回首页</Link>
          <button type="button" className="button secondary" onClick={() => { setSuccess(false); setForm(initialForm); }}>再提交一份</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero apply-hero">
        <div className="page-width apply-hero-layout">
          <div><p className="eyebrow">校园代理报名</p><h1>从你熟悉的校园开始</h1></div>
          <p>不收集姓名或证件。请留下学校、年级和微信号，我们会通过微信进一步沟通。</p>
        </div>
      </section>
      <section className="application-section page-width">
        <form ref={formRef} className="application-form" onSubmit={submit} onFocus={markStarted} noValidate>
          {!api.isSubmissionAvailable && <div className="form-error backend-unavailable" role="alert"><AlertCircle size={18} />线上报名暂未连接数据库，请先通过页面中的私人微信联系负责人。</div>}
          <div className="form-section-heading"><span>01</span><div><h2>基本信息</h2><p>用于确认你所在的校园和当前年级。</p></div></div>
          <div className="form-grid two-columns">
            <label className="field"><span>学校名称 <em>*</em></span><input list="school-options" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="输入或选择山东省内高校" aria-invalid={Boolean(error && form.school.trim().length < 2)} maxLength={60} /><datalist id="school-options">{SHANDONG_SCHOOLS.map((school) => <option value={school} key={school} />)}</datalist></label>
            <label className="field"><span>当前年级 <em>*</em></span><select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as ApplicantGrade })}>{GRADES.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
          </div>

          <div className="form-section-heading"><span>02</span><div><h2>联系方式</h2><p>以微信沟通为主，手机号仅作为备用。</p></div></div>
          <div className="form-grid two-columns">
            <label className="field"><span>微信号 <em>*</em></span><input value={form.wechatId} onChange={(e) => setForm({ ...form, wechatId: e.target.value })} placeholder="请输入可搜索到的微信号" aria-invalid={Boolean(error && form.wechatId.trim().length < 3)} maxLength={50} autoComplete="off" /></label>
            <label className="field"><span>备用手机号 <small>选填</small></span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="微信号填写错误时备用" inputMode="numeric" autoComplete="tel" /></label>
          </div>

          <div className="form-section-heading"><span>03</span><div><h2>合作方向</h2><p>至少选择一个你愿意了解或参与的方向。</p></div></div>
          <div className="interest-grid">
            {content.services.map((service) => (
              <label className={form.interests.includes(service.id) ? "interest-option selected" : "interest-option"} key={service.id}>
                <input type="checkbox" checked={form.interests.includes(service.id)} onChange={() => toggleInterest(service.id)} />
                <span>{service.shortTitle}</span>
              </label>
            ))}
          </div>
          <label className="field"><span>想法与建议 <small>选填</small></span><textarea value={form.ideas} onChange={(e) => setForm({ ...form, ideas: e.target.value })} placeholder="欢迎和我们讨论校园需求、资源合作或新的服务想法。" maxLength={800} /><small className="character-count">{form.ideas?.length || 0}/800</small></label>
          <label className="honeypot" aria-hidden="true">网站<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
          <label className="consent-row"><input type="checkbox" checked={form.privacyAccepted} onChange={(e) => setForm({ ...form, privacyAccepted: e.target.checked })} /><span>我已阅读并同意<Link to="/privacy" target="_blank">《隐私说明》</Link>，同意将以上信息用于代理报名沟通。</span></label>
          {error && <div className="form-error" role="alert"><AlertCircle size={18} />{error}</div>}
          <button className="button primary submit-button" type="submit" disabled={submitting || !api.isSubmissionAvailable}>{submitting ? "正在提交…" : <>提交报名<ArrowRight size={18} /></>}</button>
        </form>
        <aside className="application-aside">
          <p className="eyebrow">提交之后</p>
          <ol><li><span>1</span><p><strong>报名进入待联系</strong>管理员查看学校、年级和合作方向。</p></li><li><span>2</span><p><strong>私人微信沟通</strong>先了解你的想法、资源和合作方向。</p></li><li><span>3</span><p><strong>确认合作</strong>有明确意向后邀请进入企业微信，审核通过后发送代理编号。</p></li></ol>
        </aside>
      </section>
    </>
  );
}
