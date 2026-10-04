/* Shared chrome interactions (home + essay + deck) */
(function () {
  function initBrandLogo() {
    const roots = document.querySelectorAll('[data-brand-logo]')
    if (!roots.length) return
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    roots.forEach((root) => {
      const reveal = root.querySelector('.brand-reveal')
      if (!reveal) return

      const setMask = (x, y, r) => {
        const mask = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0%, #000 30%, transparent 72%)`
        reveal.style.webkitMaskImage = mask
        reveal.style.maskImage = mask
      }

      root.addEventListener('pointermove', (e) => {
        const rect = root.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const r = Math.min(Math.max(rect.width * 0.35, 28), 56)
        root.classList.add('is-hot')
        setMask(x, y, r)
      })

      root.addEventListener('pointerleave', () => {
        root.classList.remove('is-hot')
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrandLogo)
  } else {
    initBrandLogo()
  }
})()
