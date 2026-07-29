"use client";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/shadcn-io/3d-card";
import { FaCalculator } from "react-icons/fa";
import Link from "next/link";

export default function CgpaCalculatorCard() {
  return (
    <Link href="/cgpa-calculator" className="block">
      <CardContainer className="inter-var cursor-pointer" containerClassName="py-8">
        <CardBody className="bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f0c29] relative group/card hover:shadow-2xl hover:shadow-purple-500/[0.15] border-purple-900/50 w-full h-auto rounded-xl overflow-hidden border-2 transition-all duration-300">
          <div className="p-4">
          <CardItem
            translateZ="50"
            className="text-sm font-bold text-purple-300 mb-1 flex items-center gap-2"
          >
            <FaCalculator className="text-purple-400" />
            CGPA Calculator
          </CardItem>
          <CardItem
            as="p"
            translateZ="60"
            className="text-gray-400 text-xs mt-1 mb-3"
          >
            Calculate your term and total CGPA with ease and accuracy.
          </CardItem>
          </div>
          <CardItem translateZ="100">
            <img
              src="/cg_calculator.jpg"
              height="400"
              width="600"
              className="h-36 w-full object-cover group-hover/card:shadow-xl"
              alt="Calculator and academic grades"
            />
          </CardItem>
          <div className="p-4">
          <CardItem translateZ={20} className="flex justify-center">
            <span className="text-purple-300 font-bold text-xs">
              Calculate CGPA →
            </span>
          </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </Link>
  );
}