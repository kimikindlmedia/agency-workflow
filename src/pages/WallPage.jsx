import React, { useState } from 'react'
import { useApp } from '../store.jsx'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Právě teď'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} d`
}

function PostCard({ post }) {
  const { state, dispatch } = useApp()
  const { member1Name, member2Name, member3Name } = state.settings
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('member1')
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const authorName = (author) => {
    if (author === 'member1') return member1Name
    if (author === 'member2') return member2Name
    if (author === 'member3') return member3Name
    return author
  }

  const postComments = (state.postComments || []).filter(c => c.postId === post.id)

  const addComment = () => {
    if (!commentText.trim()) return
    dispatch({ type: 'ADD_POST_COMMENT', payload: { postId: post.id, content: commentText, author: commentAuthor } })
    setCommentText('')
    setShowCommentForm(false)
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Post header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {authorName(post.author).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">{authorName(post.author)}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
          <p className="text-gray-800 mt-1 whitespace-pre-wrap text-sm">{post.content}</p>
        </div>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => dispatch({ type: 'DELETE_POST', payload: { id: post.id } })} className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50">Smazat</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded bg-gray-100">Ne</button>
          </div>
        )}
      </div>

      {/* Comments */}
      {postComments.length > 0 && (
        <div className="pl-12 space-y-2">
          {postComments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                {authorName(comment.author).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-semibold text-gray-700">{authorName(comment.author)}</p>
                  <p className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</p>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'DELETE_POST_COMMENT', payload: { id: comment.id, postId: post.id } })}
                className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 mt-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="pl-12">
        {showCommentForm ? (
          <div className="flex gap-2">
            <select className="input text-sm w-28 flex-shrink-0" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}>
              <option value="member1">{member1Name}</option>
              <option value="member2">{member2Name}</option>
              <option value="member3">{member3Name}</option>
            </select>
            <input
              className="input flex-1 text-sm"
              placeholder="Napište komentář..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
              autoFocus
            />
            <button onClick={addComment} className="btn-primary text-sm flex-shrink-0">Odeslat</button>
            <button onClick={() => setShowCommentForm(false)} className="btn-secondary text-sm flex-shrink-0">Zrušit</button>
          </div>
        ) : (
          <button
            onClick={() => setShowCommentForm(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Komentovat
          </button>
        )}
      </div>
    </div>
  )
}

export default function WallPage() {
  const { state, dispatch } = useApp()
  const { member1Name, member2Name, member3Name } = state.settings
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('member1')

  const sortedPosts = [...(state.posts || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const addPost = () => {
    if (!content.trim()) return
    dispatch({ type: 'ADD_POST', payload: { content, author } })
    setContent('')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Týmová zeď</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sdílení informací a komunikace v týmu</p>
      </div>

      {/* New post */}
      <div className="card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {(author === 'member1' ? member1Name : author === 'member2' ? member2Name : member3Name).slice(0, 2).toUpperCase()}
          </div>
          <textarea
            className="input flex-1 resize-none text-sm"
            rows={3}
            placeholder="Co chcete sdílet s týmem?"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pl-12">
          <select
            className="input text-sm w-36"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          >
            <option value="member1">{member1Name}</option>
            <option value="member2">{member2Name}</option>
            <option value="member3">{member3Name}</option>
          </select>
          <button
            onClick={addPost}
            disabled={!content.trim()}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Publikovat
          </button>
        </div>
      </div>

      {/* Posts feed */}
      {sortedPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Zatím žádné příspěvky</h3>
          <p className="text-gray-500 text-sm">Sdílejte novinky, nápady nebo aktualizace s týmem.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
