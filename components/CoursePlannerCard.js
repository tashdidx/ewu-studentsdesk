"use client";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/shadcn-io/3d-card";
import { FaBookOpen } from "react-icons/fa";
import Link from "next/link";

export default function CoursePlannerCard() {
  return (
    <Link href="/course-planner" className="block">
      <CardContainer className="inter-var cursor-pointer" containerClassName="py-8">
        <CardBody className="bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f0c29] relative group/card hover:shadow-2xl hover:shadow-purple-500/[0.15] border-purple-900/50 w-full h-auto rounded-xl overflow-hidden border-2 transition-all duration-300">
          <div className="p-4">
          <CardItem
            translateZ="50"
            className="text-sm font-bold text-blue-300 mb-1 flex items-center gap-2"
          >
            <FaBookOpen className="text-blue-400" />
            Course Planner
          </CardItem>
          <CardItem
            as="p"
            translateZ="60"
            className="text-gray-400 text-xs mt-1 mb-3"
          >
            Plan your courses, avoid time conflicts, and review sections easily.
          </CardItem>
          </div>
          <CardItem translateZ="100">
            <img
              src="/routine.jpg"
              height="400"
              width="600"
              className="h-36 w-full object-cover group-hover/card:shadow-xl"
              alt="Course planning and study materials"
            />
          </CardItem>
          <div className="p-4">
          <CardItem translateZ={20} className="flex justify-center">
            <span className="text-blue-300 font-bold text-xs">
              Go to Planner →
            </span>
          </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </Link>
  );
}