"use client";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/shadcn-io/3d-card";
import { FaCalendarAlt } from "react-icons/fa";
import Link from "next/link";

export default function RoutineGeneratorCard() {
  return (
    <Link href="/routine-generator" className="block">
      <CardContainer className="inter-var cursor-pointer" containerClassName="py-8">
        <CardBody className="bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f0c29] relative group/card hover:shadow-2xl hover:shadow-purple-500/[0.15] border-purple-900/50 w-full h-auto rounded-xl overflow-hidden border-2 transition-all duration-300">
          <div className="p-4">
          <CardItem
            translateZ="50"
            className="text-sm font-bold text-emerald-300 mb-1 flex items-center gap-2"
          >
            <FaCalendarAlt className="text-emerald-400" />
            Routine Generator
          </CardItem>
          <CardItem
            as="p"
            translateZ="60"
            className="text-gray-400 text-xs mt-1 mb-3"
          >
            Generate, view, and print your weekly class routine in style.
          </CardItem>
          </div>
          <CardItem translateZ="100">
            <img
              src="/course_planner.jpg"
              height="400"
              width="600"
              className="h-36 w-full object-cover group-hover/card:shadow-xl"
              alt="Calendar and schedule planning"
            />
          </CardItem>
          <div className="p-4">
          <CardItem translateZ={20} className="flex justify-center">
            <span className="text-emerald-300 font-bold text-xs">
              Create Routine →
            </span>
          </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </Link>
  );
}