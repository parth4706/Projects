import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SKILLS, PROJECTS, JOURNEY } from './data';
import { useThreeScene } from './hooks/useThreeScene';
import { useNetworkCanvas } from './hooks/useNetworkCanvas';
import { useTilt } from './hooks/useTilt';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const navItems = ['Home', 'About', 'Skills', 'Projects', 'Journey', 'Contact'];

function Cursor({ mouse }) {
  useEffect(() => {
    if (!finePointer) return undefined;
    document.body.classList.add('has-cursor');
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return undefined;
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.09, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.09, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    const move = (event) => { dotX(event.clientX); dotY(event.clientY); ringX(event.clientX); ringY(event.clientY); mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1; };
    const over = (event) => { if (event.target.closest('a, button, .tilt, .skill-card, .project-card')) ring.classList.add('is-hover'); };
    const out = (event) => { if (event.target.closest('a, button, .tilt, .skill-card, .project-card')) ring.classList.remove('is-hover'); };
    window.addEventListener('pointermove', move, { passive: true }); document.addEventListener('mouseover', over); document.addEventListener('mouseout', out);
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('mouseover', over); document.removeEventListener('mouseout', out); document.body.classList.remove('has-cursor'); };
  }, [mouse]);
  return <><div className="cursor-dot" aria-hidden="true" /><div className="cursor-ring" aria-hidden="true" /></>;
}

function Loader({ onDone }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => Math.min(96, value + Math.random() * 16)), 110);
    const finish = window.setTimeout(() => { window.clearInterval(timer); setProgress(100); window.setTimeout(onDone, reduceMotion ? 200 : 900); }, 1500);
    return () => { window.clearInterval(timer); window.clearTimeout(finish); };
  }, [onDone]);
  return <div className="loader" id="loader">
    <div className="loader-mark" aria-hidden="true"><span /><span /></div>
    <div className="loader-name" id="loaderName">{'PARTH MEHTA'.split('').map((character, index) => <span key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}</div>
    <div className="loader-progress" style={{ '--p': `${progress}%` }}><div className="sr-only">Loading</div></div>
    <div className="loader-pct">{Math.floor(progress)}%</div>
  </div>;
}

function Navigation({ open, setOpen }) {
  const navigate = (event) => { const href = event.currentTarget.getAttribute('href'); if (!href?.startsWith('#')) return; const target = document.querySelector(href); if (!target) return; event.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); setOpen(false); };
  return <>
    <nav className="navbar" aria-label="Primary"><span className="nav-logo">P<b>M</b></span><ul className="nav-links">{navItems.map((item) => <li key={item}><a href={`#${item.toLowerCase()}`} onClick={navigate}>{item}</a></li>)}</ul><button className="nav-toggle" id="navToggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="bar" /></button></nav>
    <div className="nav-mobile" id="navMobile"><ul className="nav-mobile-links">{navItems.map((item) => <li key={item}><a href={`#${item.toLowerCase()}`} onClick={navigate}>{item}</a></li>)}</ul></div>
  </>;
}

function TiltCard({ children, className, max, as: Element = 'div', ...props }) {
  const ref = useRef(null);
  useTilt(ref, max, finePointer);
  return <Element ref={ref} className={className} {...props}>{children}</Element>;
}

function ReadabilityLayer() {
  return <span className="panel-blur" aria-hidden="true" />;
}

function Skills() {
  const [open, setOpen] = useState(null);
  return <section className="section skills" id="skills"><h2 className="section-head">Skillset</h2><div className="skills-grid">{SKILLS.map((skill, index) => <TiltCard as="button" key={skill.code} type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)} className={`skill-card tilt readability-panel ${open === index ? 'is-open' : ''}`} max={6}><ReadabilityLayer /><span className="skill-badge">{skill.code}</span><span className="skill-name">{skill.name}</span><span className="skill-desc">{skill.desc}</span></TiltCard>)}</div></section>;
}

function Projects() {
  return <section className="section projects" id="projects"><h2 className="section-head">Selected work</h2><div className="projects-grid">{PROJECTS.map((project) => <TiltCard as="article" key={project.title} className="project-card tilt readability-panel" max={5}><ReadabilityLayer />{project.placeholder && <span className="project-flag">{project.label}</span>}<h3 className="project-title">{project.title}</h3><p className="project-desc">{project.description}</p><ul className="project-tags">{project.technologies.map((technology) => <li className="tag-pill" key={technology}>{technology}</li>)}</ul><div className="project-links"><a href={project.github} target="_blank" rel="noopener" className="project-link">Code ↗</a>{project.live ? <a href={project.live} target="_blank" rel="noopener" className="project-link">Live ↗</a> : <span className="project-link is-disabled">Live soon</span>}</div></TiltCard>)}</div></section>;
}

function Journey() {
  return <section className="section journey" id="journey"><h2 className="section-head">My journey</h2><div className="journey-track"><div className="journey-line"><div className="journey-line-fill" /></div><ul className="journey-list">{JOURNEY.map((item, index) => <li className={`journey-item ${index % 2 ? 'is-right' : 'is-left'}`} key={`${item.year}-${index}`}><div className="journey-node" /><div className="journey-card glass readability-panel"><ReadabilityLayer /><span className="journey-year">{item.year}</span><h3>{item.title}</h3><p>{item.body}</p></div></li>)}</ul></div></section>;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const bgCanvas = useRef(null);
  const networkCanvas = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  useThreeScene(bgCanvas, reduceMotion, mouse);
  useNetworkCanvas(networkCanvas, reduceMotion);

  useEffect(() => {
    const updatePanels = (event) => {
      const visuals = event.detail || [];
      document.querySelectorAll('.readability-panel').forEach((panel) => {
        const bounds = panel.getBoundingClientRect();
        const masks = visuals.filter((visual) => visual.x + visual.radius >= bounds.left && visual.x - visual.radius <= bounds.right && visual.y + visual.radius >= bounds.top && visual.y - visual.radius <= bounds.bottom).slice(0, 18).map((visual) => {
          const x = visual.x - bounds.left;
          const y = visual.y - bounds.top;
          return `radial-gradient(circle at ${x}px ${y}px, #000 0, #000 ${visual.radius * 0.42}px, transparent ${visual.radius}px)`;
        });
        const layer = panel.querySelector('.panel-blur');
        if (!layer) return;
        const mask = masks.length ? masks.join(',') : 'none';
        layer.style.maskImage = mask;
        layer.style.webkitMaskImage = mask;
      });
    };
    window.addEventListener('scene-visuals', updatePanels);
    return () => window.removeEventListener('scene-visuals', updatePanels);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const sections = document.querySelectorAll('main .section[id]');
    const links = document.querySelectorAll('.nav-links a, .nav-mobile-links a');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const context = gsap.context(() => {
      const duration = reduceMotion ? 0.01 : 0.9;
      gsap.timeline({ defaults: { ease: 'power3.out' } }).to('.hero-title .line', { opacity: 1, y: 0, duration: 1, stagger: 0.1 }).to('.hero-tagline', { opacity: 1, y: 0, duration: 0.7 }, '-=0.55').to('.hero-intro', { opacity: 1, y: 0, duration: 0.7 }, '-=0.55').to('.hero-actions', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5').to('.hero-scroll-cue', { opacity: 1, duration: 0.6 }, '-=0.3');
      gsap.to('.about-panel', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration, ease: 'power3.out', scrollTrigger: { trigger: '.about-panel', start: 'top 82%', toggleActions: 'play none none reverse' } });
      gsap.from('.skill-card', { opacity: 0, y: 24, scale: 0.94, duration: reduceMotion ? 0.01 : 0.6, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.skills-grid', start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.utils.toArray('.section-head').forEach((element) => gsap.from(element, { opacity: 0, y: 28, duration, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 85%', toggleActions: 'play none none reverse' } }));
      gsap.utils.toArray('.project-card').forEach((element, index) => gsap.from(element, { opacity: 0, x: index % 2 ? 40 : -40, duration, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', toggleActions: 'play none none reverse' } }));
      gsap.to('.journey-line-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.journey-track', start: 'top 75%', end: 'bottom 70%', scrub: 0.5 } });
      gsap.utils.toArray('.journey-item').forEach((element) => { ScrollTrigger.create({ trigger: element, start: 'top 72%', onEnter: () => element.classList.add('is-active'), onLeaveBack: () => element.classList.remove('is-active') }); gsap.from(element.querySelector('.journey-card'), { opacity: 0, y: 20, duration, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 78%', toggleActions: 'play none none reverse' } }); });
      gsap.from('.think-statement, .network-wrap', { opacity: 0, y: 24, duration, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.think', start: 'top 82%', toggleActions: 'play none none reverse' } });
      gsap.to('.contact-orb', { scale: 1.7, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 75%', end: 'center center', scrub: 0.6 } });
      gsap.from('.contact .section-head, .contact-sub, .contact-links, .contact-cta', { opacity: 0, y: 22, duration, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.contact', start: 'top 78%', toggleActions: 'play none none reverse' } });
    });
    return () => context.revert();
  }, [loading]);

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <Cursor mouse={mouse} />
    <canvas id="bg-canvas" ref={bgCanvas} aria-hidden="true" />
    <div className="grain" aria-hidden="true" /><div className="vignette" aria-hidden="true" />
    {loading && <Loader onDone={() => { setLoading(false); document.body.classList.remove('is-loading'); }} />}
    <Navigation open={menuOpen} setOpen={setMenuOpen} />
    <main id="main">
      <section className="section hero" id="home"><div className="hero-content"><h1 className="hero-title"><span className="line">PARTH</span><span className="line">MEHTA</span></h1><p className="hero-tagline">Developer • Builder • Problem Solver</p><p className="hero-intro">Building interactive digital experiences and solving complex problems through code.</p><div className="hero-actions"><a href="#about" className="btn-primary">Explore my work ↓</a></div></div><div className="hero-scroll-cue" aria-hidden="true"><span className="stem" /><span>Scroll</span></div></section>
      <section className="section about" id="about"><h2 className="section-head">About me</h2><div className="about-panel glass frame-corners readability-panel"><ReadabilityLayer /><div className="about-floaters" aria-hidden="true"><span style={{ top: '8%', left: '-4%', animationDelay: '0s' }}>{'{ }'}</span><span style={{ top: '60%', left: '96%', animationDelay: '1.4s' }}>&lt;/&gt;</span><span style={{ top: '85%', left: '-2%', animationDelay: '2.6s' }}>01</span><span style={{ top: '20%', left: '98%', animationDelay: '3.6s' }}>1010</span></div><p className="about-lead">I'm Parth Mehta, a developer who enjoys building things, exploring new technologies, and solving challenging problems.</p><p className="about-sub">Curious by nature - I like taking systems apart to understand how they work, then putting that understanding into things I build.</p></div></section>
      <Skills /><Projects /><Journey />
      <section className="section think" id="think"><h2 className="section-head">Think. Build. Solve.</h2><p className="think-statement">I enjoy algorithmic problem solving as much as I enjoy shipping software - breaking a hard problem into small, connected pieces is most of the work.</p><div className="network-wrap frame-corners"><canvas id="networkCanvas" ref={networkCanvas} /></div></section>
      <section className="section contact" id="contact"><div className="contact-orb-wrap" aria-hidden="true"><div className="contact-orb" /></div><h2 className="section-head">Let's build something</h2><p className="contact-sub">Have an idea, opportunity, or project in mind?</p><div className="contact-links"><a className="btn-ghost" href="https://www.linkedin.com/in/parth-mehta-4327761ab/" target="_blank" rel="noopener">LinkedIn ↗</a><a className="btn-ghost" href="https://github.com/parth4706" target="_blank" rel="noopener">GitHub ↗</a><a className="btn-ghost" href="https://leetcode.com/u/__Parth/" target="_blank" rel="noopener">LEETCODE ↗</a></div><a className="btn-primary contact-cta" href="mailto:parthmehta4706@gmail.com">Say hello</a></section>
    </main>
    <footer><p>Designed &amp; built by Parth Mehta - <span>{new Date().getFullYear()}</span></p></footer>
  </>;
}

export default App;
