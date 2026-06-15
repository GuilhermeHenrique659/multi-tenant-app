import { Router } from "express";
import { Container } from "./Container.js";

export type Path = string;

export type RouterHandler = (container: Container) => Router;