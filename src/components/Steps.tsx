const steps = [
  { n: '01', title: 'Listen', p: 'We start with your concept, site, budget, and constraints.' },
  { n: '02', title: 'Design', p: 'Kitchen flow, layout, and operations are planned together.' },
  { n: '03', title: 'Build', p: 'We deliver the space, install the equipment, and test every line.' },
  { n: '04', title: 'Run', p: 'Optionally, we stay on to operate and train your team.' },
]

export default function Steps() {
  return (
    <section id="process">
      <div className="wrap">
        <div className="head">
          <h2>How we work</h2>
          <p>A simple, honest process from first conversation to opening night.</p>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <div key={s.n} className="step">
              <h3>{s.title}</h3>
              <p>{s.n} — {s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}