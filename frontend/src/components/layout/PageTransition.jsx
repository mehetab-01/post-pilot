import { motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -8 },
}

const pageTransition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1],
}

export function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}
