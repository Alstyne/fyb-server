const express = require('express');
const router  = express.Router();
const {
  getPosts, createPost, deletePost,
  togglePostLike,
  getPostComments, addPostComment, deletePostComment,
} = require('../controllers/feedController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',                    getPosts);
router.post('/',                   createPost);
router.delete('/:id',              deletePost);
router.post('/like',               togglePostLike);
router.get('/:id/comments',        getPostComments);
router.post('/comment',            addPostComment);
router.delete('/comment/:id',      deletePostComment);

module.exports = router;