# 评级 -> 分数。未评级（空串）不计入综合评分。
RATING_SCORES = {
    "优": 100,
    "良": 80,
    "中": 60,
    "差": 30,
}
RATING_CHOICES = tuple(RATING_SCORES.keys())
