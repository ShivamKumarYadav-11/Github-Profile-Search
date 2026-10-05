'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search,
  ExternalLink,
  BookOpen,
  Users,
  UserPlus,
  BarChart3,
  Star,
  GitFork,
  Trophy,
  ShieldCheck,
  Flame,
  ImageOff,
  MapPin,
  Building2,
  Link as LinkIcon,
  GitBranch,
  Clock,
  FolderX,
} from 'lucide-react'
import gsap from 'gsap'

/* ============================================
   WEB3FORMS — Log searched usernames
   ============================================ */
const WEB3FORMS_ACCESS_KEY = 'ACESS_KEY_HERE'

function saveSearch(username) {
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: 'New Search: ' + username,
      from_name: 'GitHub Profile Explorer',
      username: username,
      searched_at: new Date().toLocaleString(),
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log('Search logged:', result.message)
    })
    .catch((error) => {
      console.error('Logging failed:', error)
    })
}

/* ============================================
   LANGUAGE COLOR MAP
   ============================================ */
const languageColorMap = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Scala: '#c22d40',
  Lua: '#000080',
  R: '#198CE7',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  'Jupyter Notebook': '#DA5B0B',
  Dockerfile: '#384d54',
  PowerShell: '#012456',
  'Objective-C': '#438eff',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Perl: '#0298c3',
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function formatDate(isoDateString) {
  if (!isoDateString) return 'N/A'
  const dateObject = new Date(isoDateString)
  return dateObject.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRelativeTime(isoDateString) {
  if (!isoDateString) return ''
  const dateNow = new Date()
  const dateThen = new Date(isoDateString)
  const diffMilliseconds = dateNow - dateThen
  const diffSeconds = Math.floor(diffMilliseconds / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `Updated ${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  if (diffMonths > 0) return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  if (diffDays > 0) return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMinutes > 0) return `Updated ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  return 'Updated just now'
}

function getLanguageColor(languageName) {
  if (!languageName) return '#8b949e'
  return languageColorMap[languageName] || '#8b949e'
}

function formatNumber(numberValue) {
  if (numberValue === null || numberValue === undefined) return '0'
  return numberValue.toLocaleString('en-US')
}

/* ============================================
   API FETCH FUNCTIONS
   ============================================ */

async function fetchUserProfile(username) {
  const profileUrl = `https://api.github.com/users/${username}`
  const response = await fetch(profileUrl)

  if (response.status === 404) {
    throw new Error(`User "${username}" not found on GitHub.`)
  }
  if (response.status === 403) {
    throw new Error('API rate limit exceeded. Please wait a moment and try again.')
  }
  if (!response.ok) {
    throw new Error(`GitHub API error (status ${response.status}). Please try again.`)
  }

  return await response.json()
}

async function fetchUserRepositories(username) {
  const allRepos = []
  let pageNumber = 1
  const reposPerPage = 100

  while (true) {
    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=${reposPerPage}&page=${pageNumber}&sort=updated`
    const response = await fetch(reposUrl)

    if (response.status === 403) {
      throw new Error('API rate limit exceeded. Please wait and try again.')
    }
    if (!response.ok) {
      throw new Error('Failed to fetch repositories. Please try again.')
    }

    const pageRepos = await response.json()

    if (pageRepos.length === 0) break

    allRepos.push(...pageRepos)

    if (pageRepos.length < reposPerPage) break

    pageNumber++
  }

  return allRepos
}

const REPOS_PER_PAGE = 10

/* ============================================
   MAIN PAGE COMPONENT
   ============================================ */
export default function GitHubProfileExplorer() {
  /* --- state (replaces appState + DOM manipulation) --- */
  const [searchValue, setSearchValue] = useState('')
  const [message, setMessage] = useState(null) // { text, type }
  const [loading, setLoading] = useState(false)
  const [searchButtonDisabled, setSearchButtonDisabled] = useState(false)

  const [profile, setProfile] = useState(null)
  const [repos, setRepos] = useState([])
  const [currentUsername, setCurrentUsername] = useState('')
  const [searchId, setSearchId] = useState(0)

  const [filterInputValue, setFilterInputValue] = useState('')
  const [languageFilter, setLanguageFilter] = useState(null) // null = "All"
  const [sortMode, setSortMode] = useState('updated')
  const [currentPage, setCurrentPage] = useState(1)

  const [streakStatus, setStreakStatus] = useState('loading') // loading | loaded | error
  const [graphStatus, setGraphStatus] = useState('loading')

  const searchInputRef = useRef(null)
  const repoFilterInputRef = useRef(null)
  const reposSectionRef = useRef(null)

  const filterSearchText = filterInputValue.trim()

  /* ============================================
     SIDE EFFECTS
     ============================================ */

  // Disable Right-Click + DevTools shortcuts (same as original script.js)
  useEffect(() => {
    const onContextMenu = (e) => e.preventDefault()

    const onKeyDown = (e) => {
      if (e.key === 'F12') e.preventDefault()
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j'].includes(e.key)) e.preventDefault()
      if (e.ctrlKey && ['u', 'U'].includes(e.key)) e.preventDefault()
      if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j'].includes(e.key)) e.preventDefault()
    }

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])


 // GSAP intro animations (Strict Mode safe)
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.app-header', { y: 100, opacity: 0, delay: 0.5, duration: 0.5 })
    gsap.from('.search-section', { y: 60, opacity: 0, delay: 0.5, duration: 0.5 })
    gsap.from('.footer', { y: 20, opacity: 0, delay: 0.5, duration: 0.5 })
  })

  // Strict Mode double-run pe purani tweens revert ho jaati hain
  return () => ctx.revert()
}, [])

  /* ============================================
     DERIVED DATA (replaces applyFiltersAndRender / sortRepositories)
     ============================================ */

  const languageCounts = useMemo(() => {
    const counts = {}
    repos.forEach((repo) => {
      const languageName = repo.language || 'Unknown'
      counts[languageName] = (counts[languageName] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [repos])

  const filteredRepos = useMemo(() => {
    let filteredList = [...repos]

    if (filterSearchText.length > 0) {
      filteredList = filteredList.filter((repo) => {
        const nameMatch = repo.name.toLowerCase().includes(filterSearchText)
        const descriptionMatch = repo.description
          ? repo.description.toLowerCase().includes(filterSearchText)
          : false
        return nameMatch || descriptionMatch
      })
    }

    if (languageFilter !== null) {
      filteredList = filteredList.filter((repo) => (repo.language || 'Unknown') === languageFilter)
    }

    return filteredList
  }, [repos, filterSearchText, languageFilter])

  const sortedRepos = useMemo(() => {
    const sortedList = [...filteredRepos]
    switch (sortMode) {
      case 'updated':
        sortedList.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        break
      case 'stars':
        sortedList.sort((a, b) => b.stargazers_count - a.stargazers_count)
        break
      case 'name':
        sortedList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        break
      default:
        break
    }
    return sortedList
  }, [filteredRepos, sortMode])

  const repoStats = useMemo(() => {
    let totalStars = 0
    let totalForks = 0
    let topRepo = null
    let topStars = 0

    repos.forEach((repo) => {
      totalStars += repo.stargazers_count || 0
      totalForks += repo.forks_count || 0
      if ((repo.stargazers_count || 0) > topStars) {
        topStars = repo.stargazers_count
        topRepo = repo
      }
    })

    return { totalStars, totalForks, topRepo, topStars }
  }, [repos])

  /* --- pagination --- */
  const totalRepos = sortedRepos.length
  const totalPages = Math.ceil(totalRepos / REPOS_PER_PAGE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const startIndex = (safeCurrentPage - 1) * REPOS_PER_PAGE
  const pageRepos = sortedRepos.slice(startIndex, startIndex + REPOS_PER_PAGE)

  /* --- contribution image URLs --- */
  const streakSrc = currentUsername
    ? `https://github-readme-streak-stats.herokuapp.com?user=${currentUsername}&theme=dark&hide_border=true&background=161b22&card_width=880`
    : ''
  const graphSrc = currentUsername ? `https://ghchart.rshah.org/d15fbc/${currentUsername}` : ''

  /* ============================================
     EVENT HANDLERS
     ============================================ */

  const handleSearch = async () => {
    const enteredUsername = searchValue.trim()

    if (!enteredUsername) {
      setMessage({ text: 'Please enter a GitHub username.', type: 'error' })
      searchInputRef.current?.focus()
      return
    }

    setMessage(null)

    // Reset app state (same resets as original handleSearch)
    setProfile(null)
    setRepos([])
    setCurrentUsername(enteredUsername)
    setSearchId((id) => id + 1)
    setFilterInputValue('')
    setLanguageFilter(null)
    setCurrentPage(1)
    setStreakStatus('loading')
    setGraphStatus('loading')

    setLoading(true)
    setSearchButtonDisabled(true)

    try {
      // Step 1: Fetch user profile
      const profileData = await fetchUserProfile(enteredUsername)
      saveSearch(enteredUsername)

      // Step 2: Fetch repositories
      const repositoriesData = await fetchUserRepositories(enteredUsername)

      // Step 3+: store data — all sections render automatically
      setProfile(profileData)
      setRepos(repositoriesData)
    } catch (error) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
      setSearchButtonDisabled(false)
    }
  }

  const handleFilterChange = (event) => {
    setFilterInputValue(event.target.value)
    setCurrentPage(1)
  }

  const handleClearFilter = () => {
    setFilterInputValue('')
    setCurrentPage(1)
    repoFilterInputRef.current?.focus()
  }

  const handleLanguageChipClick = (selectedLanguage) => {
    setLanguageFilter(selectedLanguage === 'all' ? null : selectedLanguage)
    setCurrentPage(1)
  }

  const handleSortClick = (selectedSortMode) => {
    setSortMode(selectedSortMode)
    setCurrentPage(1)
  }

  const scrollToReposTop = () => {
    reposSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToPreviousPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage((page) => page - 1)
      scrollToReposTop()
    }
  }

  const goToNextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage((page) => page + 1)
      scrollToReposTop()
    }
  }

  /* ============================================
     RENDER
     ============================================ */
  return (
    <>
      <div className="app-container">
        {/* HEADER */}
        <header className="app-header">
          <img src="/Github.png" alt="" />
          <h1>GitHub Profile Explorer</h1>
          <p className="subtitle">Search any GitHub username to view their profile and repositories</p>
        </header>

        {/* SEARCH */}
        <section className="search-section" aria-label="Search for a GitHub user">
          <div className="search-bar">
            <span className="search-icon">
              <Search size={20} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              id="searchInput"
              placeholder="Enter GitHub username..."
              aria-label="GitHub username"
              autoComplete="off"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch()
              }}
            />
            <button id="searchButton" type="button" onClick={handleSearch} disabled={searchButtonDisabled}>
              Search
            </button>
          </div>
        </section>

        {/* MESSAGE */}
        <div id="messageBox" className={`message-box ${message ? message.type : 'hidden'}`} role="alert">
          {message ? message.text : ''}
        </div>

        {/* LOADING */}
        <div id="loadingContainer" className={`loading-container ${loading ? 'active' : ''}`} aria-label="Loading">
          <div className="spinner" />
        </div>

        {profile && (
          <>
            {/* PROFILE */}
            <section id="profileSection" className="profile-section visible" aria-label="User profile">
              <div className="profile-card">
                <div className="profile-top">
                  <img
                    id="profileAvatar"
                    className="profile-avatar"
                    src={profile.avatar_url}
                    alt={`${profile.login}'s avatar`}
                  />
                  <div className="profile-info">
                    <h2 id="profileName" className="profile-name">
                      {profile.name || profile.login}
                    </h2>
                    <p id="profileLogin" className="profile-login">
                      Username: {profile.login}
                    </p>
                    {profile.bio && <p id="profileBio" className="profile-bio">{profile.bio}</p>}

                    <div id="profileDetails" className="profile-details">
                      {profile.location && (
                        <div className="profile-detail-item">
                          <MapPin />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.company && (
                        <div className="profile-detail-item">
                          <Building2 />
                          <span>{profile.company}</span>
                        </div>
                      )}
                      {profile.blog && (
                        <div className="profile-detail-item">
                          <LinkIcon />
                          <a
                            href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
                          >
                            {profile.blog}
                          </a>
                        </div>
                      )}
                    </div>

                    <a
                      id="profileLink"
                      className="profile-link"
                      href={profile.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* STATS GRID */}
            <section id="statsGridSection" className="stats-grid-section visible" aria-label="Statistics overview">
              <div className="stats-grid">
                <div className="stats-grid-item repos-grid">
                  <BookOpen className="grid-stat-icon" />
                  <div className="grid-stat-value">{formatNumber(profile.public_repos)}</div>
                  <div className="grid-stat-label">Repositories</div>
                </div>
                <div className="stats-grid-item followers-grid">
                  <Users className="grid-stat-icon" />
                  <div className="grid-stat-value">{formatNumber(profile.followers)}</div>
                  <div className="grid-stat-label">Followers</div>
                </div>
                <div className="stats-grid-item following-grid">
                  <UserPlus className="grid-stat-icon" />
                  <div className="grid-stat-value">{formatNumber(profile.following)}</div>
                  <div className="grid-stat-label">Following</div>
                </div>
              </div>
            </section>

            {/* REPO STATS */}
            <section id="repoStatsSection" className="repo-stats-section visible" aria-label="Repository statistics">
              <div className="repo-stats-card">
                <div className="repo-stats-title">
                  <BarChart3 />
                  Repository Statistics
                </div>
                <div className="repo-stats-grid">
                  <div className="repo-stat-item stars-stat">
                    <Star className="repo-stat-icon" />
                    <div className="repo-stat-value">{formatNumber(repoStats.totalStars)}</div>
                    <div className="repo-stat-label">Total Stars</div>
                  </div>
                  <div className="repo-stat-item forks-stat">
                    <GitFork className="repo-stat-icon" />
                    <div className="repo-stat-value">{formatNumber(repoStats.totalForks)}</div>
                    <div className="repo-stat-label">Total Forks</div>
                  </div>
                  <div className="repo-stat-item trophy-stat">
                    <Trophy className="repo-stat-icon" />
                    {repoStats.topRepo && repoStats.topStars > 0 ? (
                      <>
                        <div className="repo-stat-value repo-stat-value-sm">
                          <a
                            href={repoStats.topRepo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontSize: '0.92rem' }}
                          >
                            {repoStats.topRepo.name}
                          </a>
                        </div>
                        <div className="repo-stat-label">{formatNumber(repoStats.topStars)} stars</div>
                      </>
                    ) : (
                      <>
                        <div className="repo-stat-value repo-stat-value-sm">--</div>
                        <div className="repo-stat-label">Most Starred</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ACCOUNT DETAILS */}
            <section id="accountDetailsSection" className="account-details-section visible" aria-label="Account details">
              <div className="account-details-card">
                <div className="account-details-title">
                  <ShieldCheck />
                  Account Details
                </div>
                <div className="account-details-grid">
                  <div className="account-detail-item">
                    <div className="detail-label">Public Repos</div>
                    <div className="detail-value">{formatNumber(profile.public_repos)}</div>
                  </div>
                  <div className="account-detail-item">
                    <div className="detail-label">Public Gists</div>
                    <div className="detail-value">{formatNumber(profile.public_gists)}</div>
                  </div>
                  <div className="account-detail-item">
                    <div className="detail-label">Created At</div>
                    <div className="detail-value">{formatDate(profile.created_at)}</div>
                  </div>
                  <div className="account-detail-item">
                    <div className="detail-label">Updated At</div>
                    <div className="detail-value">{formatDate(profile.updated_at)}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* CONTRIBUTION ACTIVITY */}
            <section id="contributionSection" className="contribution-section visible" aria-label="Contribution activity">
              <div className="contribution-card">
                <div className="contribution-title">
                  <Flame />
                  Contribution Activity
                </div>
                <div className="contribution-images">
                  <div className="contribution-streak-wrapper">
                    <img
                      key={`streak-${searchId}`}
                      id="streakStatsImage"
                      className={`contribution-external-img ${streakStatus === 'loaded' ? 'loaded' : ''}`}
                      src={streakSrc}
                      alt="GitHub streak statistics"
                      onLoad={(event) => {
                        setStreakStatus('loaded')
                        gsap.fromTo(
                          event.currentTarget,
                          { opacity: 0, y: 8 },
                          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                        )
                      }}
                      onError={() => setStreakStatus('error')}
                    />
                    {streakStatus === 'loading' && (
                      <div id="streakLoading" className="contrib-img-loading">
                        <div className="spinner" />
                      </div>
                    )}
                    {streakStatus === 'error' && (
                      <div id="streakError" className="contrib-img-error">
                        <ImageOff size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p>Unable to load streak statistics</p>
                      </div>
                    )}
                  </div>

                  <div className="contribution-graph-wrapper">
                    <img
                      key={`graph-${searchId}`}
                      id="contributionGraphImage"
                      className={`contribution-external-img ${graphStatus === 'loaded' ? 'loaded' : ''}`}
                      src={graphSrc}
                      alt="GitHub contribution graph"
                      onLoad={(event) => {
                        setGraphStatus('loaded')
                        gsap.fromTo(
                          event.currentTarget,
                          { opacity: 0, y: 8 },
                          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                        )
                      }}
                      onError={() => setGraphStatus('error')}
                    />
                    {graphStatus === 'loading' && (
                      <div id="graphLoading" className="contrib-img-loading">
                        <div className="spinner" />
                      </div>
                    )}
                    {graphStatus === 'error' && (
                      <div id="graphError" className="contrib-img-error">
                        <ImageOff size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p>Unable to load contribution graph</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* REPOS */}
            <section id="reposSection" className="repos-section visible" ref={reposSectionRef} aria-label="User repositories">
              <div className="repos-header">
                <h3 className="repos-title">Repositories</h3>
                <span id="reposCountBadge" className="repos-count-badge">{totalRepos}</span>
              </div>

              <div className="repo-filter-search">
                <span className="filter-search-icon">
                  <Search size={16} />
                </span>
                <input
                  ref={repoFilterInputRef}
                  type="text"
                  id="repoFilterInput"
                  placeholder="Filter repositories by name..."
                  aria-label="Filter repositories"
                  autoComplete="off"
                  value={filterInputValue}
                  onChange={handleFilterChange}
                />
                {filterSearchText.length > 0 && (
                  <button id="filterClearButton" className="filter-clear-btn" type="button" onClick={handleClearFilter}>
                    Clear
                  </button>
                )}
              </div>

              {languageCounts.length > 0 && (
                <div id="languageFiltersSection" className="language-filters-section">
                  <div className="language-filters-label">Filter by Language</div>
                  <div id="languageChipsContainer" className="language-chips-container">
                    <button
                      className={`language-chip ${languageFilter === null ? 'active' : ''}`}
                      onClick={() => handleLanguageChipClick('all')}
                    >
                      <span className="chip-dot" style={{ background: 'var(--accent-green)' }} />
                      All
                      <span className="chip-count">{repos.length}</span>
                    </button>
                    {languageCounts.map(([languageName, repoCount]) => (
                      <button
                        key={languageName}
                        className={`language-chip ${languageFilter === languageName ? 'active' : ''}`}
                        onClick={() => handleLanguageChipClick(languageName)}
                      >
                        <span className="chip-dot" style={{ background: getLanguageColor(languageName) }} />
                        {languageName}
                        <span className="chip-count">{repoCount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="sort-controls">
                <button className={`sort-btn ${sortMode === 'updated' ? 'active' : ''}`} onClick={() => handleSortClick('updated')}>
                  Last Updated
                </button>
                <button className={`sort-btn ${sortMode === 'stars' ? 'active' : ''}`} onClick={() => handleSortClick('stars')}>
                  Most Stars
                </button>
                <button className={`sort-btn ${sortMode === 'name' ? 'active' : ''}`} onClick={() => handleSortClick('name')}>
                  Name
                </button>
              </div>

              <div id="reposContainer">
                {totalRepos === 0 ? (
                  <div className="empty-state">
                    <FolderX />
                    <p>No repositories match your filter</p>
                  </div>
                ) : (
                  pageRepos.map((repo) => (
                    <article className="repo-card" key={repo.id}>
                      <div className="repo-card-top">
                        <GitBranch />
                        <a className="repo-name" href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                        {repo.fork && <span className="fork-badge">Fork</span>}
                        <span className="repo-visibility">{repo.private ? 'Private' : 'Public'}</span>
                      </div>

                      {repo.description && <p className="repo-description">{repo.description}</p>}

                      <div className="repo-meta">
                        {repo.language && (
                          <span className="repo-meta-item">
                            <span className="lang-dot" style={{ background: getLanguageColor(repo.language) }} />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className="repo-meta-item">
                            <Star style={{ color: 'var(--accent-orange)' }} />
                            {repo.stargazers_count}
                          </span>
                        )}
                        {repo.forks_count > 0 && (
                          <span className="repo-meta-item">
                            <GitFork style={{ color: 'var(--text-muted)' }} />
                            {repo.forks_count}
                          </span>
                        )}
                        <span className="repo-meta-item" title={formatDate(repo.pushed_at)}>
                          <Clock style={{ color: 'var(--text-muted)' }} />
                          {getRelativeTime(repo.pushed_at)}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div id="paginationContainer" className="pagination">
                  <button onClick={goToPreviousPage} disabled={safeCurrentPage === 1}>
                    Previous
                  </button>
                  <span className="page-info">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <button onClick={goToNextPage} disabled={safeCurrentPage === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="footer">
        <p>&copy; 2026 &nbsp;|&nbsp; Created by Shivam Kumar Yadav |&nbsp; SKY</p>
      </div>
    </>
  )
}