import { ACTIONS, sendMessage } from '../../utils/sendMessage.ts'
import BrandBadge, { Brand } from '../../components/BrandBadge/BrandBadge.tsx'
import styles from './styles.module.css'
import goldBullion from '../../assets/gold-bullion.png'
import bookingBadge from '../../assets/booking-badge-sm.svg'
import nike from '../../assets/nike.png'
import bestbuy from '../../assets/bestbuy.svg'
import gap from '../../assets/gap.png'
import levis from '../../assets/levis.svg'
import iherb from '../../assets/iherb.png'
import adidas from '../../assets/adidas.png'
import samsung from '../../assets/samsung.png'
import dell from '../../assets/dell.png'
import walmart from '../../assets/walmart.png'

// Logo size and offset from the circle's centre, as in the design
const BRANDS: Brand[] = [
    { name: 'Nike', logo: nike, w: 26.686, h: 10.589, dx: 1.05, dy: 1.19 },
    { name: 'Best Buy', logo: bestbuy, dx: 0.5, dy: 0.5 },
    { name: 'GAP', logo: gap, w: 19.855, h: 19.855, dx: 0.05, dy: 0.11 },
    { name: "Levi's", logo: levis, dx: 0.21, dy: 1.03 },
    { name: 'iHerb', logo: iherb, w: 31, h: 17, dx: 0.5, dy: 0.5 },
    { name: 'adidas', logo: adidas, w: 30, h: 20, dy: -1 },
    { name: 'Samsung', logo: samsung, w: 32.04, h: 5, dx: 0.17, dy: 0.5 },
    { name: 'Booking.com', badge: bookingBadge },
    { name: 'Dell', logo: dell, w: 30.68, h: 9.266, dx: 0.02, dy: 0.11 },
    { name: 'Walmart', logo: walmart, w: 29.547, h: 21.179, dx: -0.21, dy: -1.73 },
]

const Embed = () => {
    return (
        <main className={styles.frame}>
            <img className={styles.background} src={goldBullion} alt="" />
            <div className={styles.scrim} />
            <div className={styles.content}>
                <p className={styles.offering}>Offering:</p>
                <h1 className={styles.title}>Gold Cashback</h1>
                <ul className={styles.brands} aria-label="Brands">
                    {BRANDS.map(brand => <BrandBadge key={brand.name} brand={brand} size="sm" />)}
                </ul>
                <button type="button" className={styles.portal} onClick={() => sendMessage(ACTIONS.OPEN_CASHBACK_PAGE)}>Cashback Portal</button>
            </div>
        </main>
    )
}

export default Embed
