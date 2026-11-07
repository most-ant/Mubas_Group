import greenTableImage from './works/The Green Table.jpg'
import akageraLodgeImage from './works/Akagera Lodge.jpg'
import blueRoomImage from './works/Blue Room Bistro.jpg'
import hilltopKitchenImage from './works/Hilltop Kitchen.jpg'

const tiles = [
  { cls: 't1', title: 'The Green Table', sub: 'Restaurant · Kigali', image: greenTableImage.src },
  { cls: 't2', title: 'Akagera Lodge', sub: 'Hospitality · Eastern Province', image: akageraLodgeImage.src },
  { cls: 't3', title: 'Blue Room Bistro', sub: 'Café · Kigali', image: blueRoomImage.src },
  { cls: 't4', title: 'Hilltop Kitchen', sub: 'Commercial kitchen · Musanze', image: hilltopKitchenImage.src },
]

export default function Work() {
  return (
    <section id="work">
      <div className="wrap">
        <div className="head">
          <h2>Selected work</h2>
          <p>A few of the spaces and operations we have brought to life.</p>
        </div>
        <div className="work">
          {tiles.map((t) => (
            <div key={t.title} className={`tile ${t.cls}`}>
              <img className="tile-image" src={t.image} alt="" loading="lazy" />
              <h3>{t.title}</h3>
              <span>{t.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}