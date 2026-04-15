import "react";
import { motion } from "framer-motion";
import GeneratorForm from "../../components/GeneratorForm";

export default function Generate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Generate email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your offer and target — get a cold email, LinkedIn DM and
          follow-up instantly.
        </p>
      </div>
      <GeneratorForm />
    </motion.div>
  );
}
