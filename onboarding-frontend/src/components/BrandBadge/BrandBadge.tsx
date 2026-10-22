import styles from './styles.module.css'
import ringLg from '../../assets/badge.svg'
import ringSm from '../../assets/badge-sm.svg'

export interface Brand {
    name: string
    // Full badge: the SVG already contains the white circle and the logo
    badge?: string
    // Otherwise: a logo laid over the plain circle. w/h omitted keeps an SVG's own size.
    logo?: string
    w?: number
    h?: number
    dx?: number
    dy?: number
}

interface Props {
    brand: Brand
    size: 'lg' | 'sm'
}

const BrandBadge = ({ brand: { name, badge, logo, w, h, dx = 0, dy = 0 }, size }: Props) => {
    const ring = size === 'lg' ? ringLg : ringSm
    return (
        <li className={`${styles.badge} ${styles[size]}`}>
            {badge ?
                <img className={styles.ring} src={badge} alt={name} />
                :
                <>
                    <img className={styles.ring} src={ring} alt="" />
                    <img
                        className={styles.logo}
                        src={logo}
                        alt={name}
                        style={{ width: w, height: h, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` }}
                    />
                </>
            }
        </li>
    )
}

export default BrandBadge
