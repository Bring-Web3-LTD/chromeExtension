import { ACTIONS, sendMessage } from '../../utils/sendMessage.ts'
import { legalUrl } from '../../utils/legalUrl.ts'
import BrandBadge, { Brand } from '../../components/BrandBadge/BrandBadge.tsx'
import styles from './styles.module.css'
import goldBullion from '../../assets/gold-bullion.png'
import levisBadge from '../../assets/levis-badge.svg'
import legoBadge from '../../assets/lego-badge.svg'
import bestbuyBadge from '../../assets/bestbuy-badge.svg'
import sephora from '../../assets/sephora.png'
import gap from '../../assets/gap.png'
import hm from '../../assets/hm.png'
import macys from '../../assets/macys.png'
import trip from '../../assets/trip.png'
import iherb from '../../assets/iherb.png'
import adidas from '../../assets/adidas.png'
import samsung from '../../assets/samsung.png'
import lg from '../../assets/lg.png'
import dell from '../../assets/dell.png'
import lenovo from '../../assets/lenovo.png'
import tetherGold from '../../assets/tether-gold.png'
import ambientGlow from '../../assets/ambient-glow.svg'
import sparkle1 from '../../assets/sparkle-1.svg'
import sparkle2 from '../../assets/sparkle-2.svg'
import sparkle3 from '../../assets/sparkle-3.svg'
import sparkle4 from '../../assets/sparkle-4.svg'

// Logo size and offset from the circle's centre, as in the design
const BRANDS: Brand[] = [
    { name: "Levi's", badge: levisBadge },
    { name: 'Sephora', logo: sephora, w: 64.698, h: 8.396, dx: 0.19, dy: 0.2 },
    { name: 'GAP', logo: gap, w: 37.041, h: 37.041, dx: 0.09, dy: 0.2 },
    { name: 'H&M', logo: hm, w: 50.376, h: 50.376, dx: 0.03, dy: -0.54 },
    { name: "Macy's", logo: macys, w: 60.124, h: 17.286, dx: -1.15, dy: 0.2 },
    { name: 'LEGO', badge: legoBadge },
    { name: 'Trip.com', logo: trip, w: 62.723, h: 15.31, dx: -0.48, dy: 0.46 },
    { name: 'iHerb', logo: iherb, w: 57, h: 32, dx: 0.46, dy: -0.5 },
    { name: 'adidas', logo: adidas, w: 48.894, h: 33.584, dx: 0.09, dy: -3.51 },
    { name: 'Samsung', logo: samsung, w: 63.94, h: 9.878, dx: -0.77, dy: -0.05 },
    { name: 'Best Buy', badge: bestbuyBadge },
    { name: 'LG', logo: lg, w: 63.217, h: 33.09, dx: -1.04, dy: 0.2 },
    { name: 'Dell', logo: dell, w: 57.235, h: 17.286, dx: 0.03, dy: 0.2 },
    { name: 'Lenovo', logo: lenovo, w: 60.875, h: 12.841, dx: 0.23, dy: -0.05 },
]

// Position inside the sparkles box, in % of its size
const SPARKLES = [
    { src: sparkle1, left: 99.38, top: 91.05 },
    { src: sparkle2, left: 0, top: 98.9 },
    { src: sparkle2, left: 45.41, top: 65.93 },
    { src: sparkle1, left: 20.6, top: 63.58 },
    { src: sparkle3, left: 80.02, top: 0 },
    { src: sparkle4, left: 88.71, top: 12.56 },
]

const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>

const Start = () => {
    const termsUrl = legalUrl('bringTou')
    const privacyUrl = legalUrl('privacyPolicy')

    return (
        <div className={styles.page}>
            <img className={styles.background} src={goldBullion} alt="" />
            <div className={styles.scrim} />
            <img className={styles.glow} src={ambientGlow} alt="" />
            <div className={styles.sparkles} aria-hidden="true">
                {SPARKLES.map(({ src, left, top }, i) =>
                    <img key={i} src={src} alt="" style={{ left: `${left}%`, top: `${top}%` }} />
                )}
            </div>

            <header className={styles.header}>
                <div className={styles.brand}>
                    <p className={styles.logo}>ecko<span className={styles.logo_accent}>WALLET</span></p>
                    <p className={styles.tagline}>The Kadena ecosystem gateway</p>
                </div>
                <button type="button" className={styles.wallet} onClick={() => sendMessage(ACTIONS.OPEN_WALLET)}>KDA Wallet</button>
            </header>

            <main className={styles.content}>
                <p className={styles.offering}>Offering:</p>
                <h1 className={styles.headline}>
                    <span className={styles.gold}>Gold</span> cashback from<br />thousands of brands
                </h1>
                <ul className={styles.brands} aria-label="Brands">
                    {BRANDS.map(brand => <BrandBadge key={brand.name} brand={brand} size="lg" />)}
                </ul>
                <button type="button" className={styles.portal} onClick={() => sendMessage(ACTIONS.OPEN_CASHBACK_PAGE)}>Go to Portal</button>
                {termsUrl &&
                    <p className={styles.terms}>
                        By continuing you agree to the <a href={termsUrl} target="_blank" rel="noopener noreferrer">Terms of Use<NewTab /></a>
                    </p>
                }
            </main>

            <footer className={styles.footer}>
                <div className={styles.links}>
                    <span>Powered by Bring</span>
                    {privacyUrl && <a href={privacyUrl} target="_blank" rel="noopener noreferrer">Privacy Policy<NewTab /></a>}
                </div>
                <div className={styles.claim}>
                    <span>Claimed with</span>
                    <span className={styles.plate}>
                        <img src={tetherGold} alt="Tether Gold" />
                    </span>
                </div>
            </footer>
        </div>
    )
}

export default Start
