"use client";

import { useState } from "react";
import { toast } from "@/components/ui/Toast";

interface CollageRatingProps {
  onSubmitRating: (rating: number, comment: string) => Promise<void>;
  title: string;
  ratingText: string;
  commentText: string;
  submitText: string;
  thanksText: string;
}

export default function CollageRating({
  onSubmitRating,
  title,
  ratingText,
  commentText,
  submitText,
  thanksText,
}: CollageRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error("请先选择评分");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitRating(rating, comment);
      setHasRated(true);
      // 评分成功不显示 toast 消息，因为已经有了视觉反馈（切换到感谢页面）
      // toast.success("感谢您的评分！");
    } catch (error) {
      console.error("评分提交失败：", error);
      toast.error("评分提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasRated) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center mb-8">
        <p className="text-green-800">{thanksText}</p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{ratingText}</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-2xl focus:outline-none"
            >
              {star <= (hoveredRating || rating) ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-gray-300">☆</span>
              )}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {rating > 0 ? `${rating} 星` : "请选择"}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{commentText}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          rows={3}
          placeholder="分享您对拼图工具的使用体验..."
        />
      </div>

      <button
        onClick={handleRatingSubmit}
        disabled={isSubmitting || rating === 0}
        className={`px-4 py-2 rounded-md font-medium ${
          isSubmitting || rating === 0
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary/90"
        }`}
      >
        {isSubmitting ? "提交中..." : submitText}
      </button>
    </div>
  );
}