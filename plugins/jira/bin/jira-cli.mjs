#!/usr/bin/env -S OPENSSL_CONF=/dev/null node

// ../../plugins/jira/src/storage/content.ts
var CONTENT = {
  workItem: { assetType: "jiraIssue", keyPrefix: "jira/work-items/" },
  project: { assetType: "jiraProject", keyPrefix: "jira/project-context/" },
  projectConfiguration: {
    assetType: "jiraProjectConfiguration",
    keyPrefix: "jira/project-config/"
  },
  site: { assetType: "atlassianSite", keyPrefix: "jira/project-key-index/" },
  record: { assetType: "storedRecord" }
};
var definitions = Object.values(CONTENT);
function isAssetType(value) {
  return definitions.some((definition) => definition.assetType === value);
}
function assetTypeForStoredKey(key) {
  const definition = definitions.find(
    (candidate) => "keyPrefix" in candidate && key.startsWith(candidate.keyPrefix)
  );
  if (definition !== void 0) return definition.assetType;
  return key.startsWith("storage/") || key.startsWith("jira/") ? void 0 : CONTENT.record.assetType;
}

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/error.js
var CommanderError = class extends Error {
  /**
   * Constructs the CommanderError class
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   */
  constructor(exitCode, code, message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = void 0;
  }
};
var InvalidArgumentError = class extends CommanderError {
  /**
   * Constructs the InvalidArgumentError class
   * @param {string} [message] explanation of why argument is invalid
   */
  constructor(message) {
    super(1, "commander.invalidArgument", message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
};

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/argument.js
var Argument = class {
  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */
  constructor(name, description) {
    this.description = description || "";
    this.variadic = false;
    this.parseArg = void 0;
    this.defaultValue = void 0;
    this.defaultValueDescription = void 0;
    this.argChoices = void 0;
    switch (name[0]) {
      case "<":
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case "[":
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }
    if (this._name.endsWith("...")) {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }
  /**
   * Return argument name.
   *
   * @return {string}
   */
  name() {
    return this._name;
  }
  /**
   * @package
   */
  _collectValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }
    previous.push(value);
    return previous;
  }
  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Argument}
   */
  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }
  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */
  argParser(fn2) {
    this.parseArg = fn2;
    return this;
  }
  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */
  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(
          `Allowed choices are ${this.argChoices.join(", ")}.`
        );
      }
      if (this.variadic) {
        return this._collectValue(arg, previous);
      }
      return arg;
    };
    return this;
  }
  /**
   * Make argument required.
   *
   * @returns {Argument}
   */
  argRequired() {
    this.required = true;
    return this;
  }
  /**
   * Make argument optional.
   *
   * @returns {Argument}
   */
  argOptional() {
    this.required = false;
    return this;
  }
};
function humanReadableArgName(arg) {
  const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
  return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
}

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/command.js
import { EventEmitter } from "node:events";
import childProcess from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import process2 from "node:process";
import { stripVTControlCharacters as stripVTControlCharacters2 } from "node:util";

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/help.js
import { stripVTControlCharacters } from "node:util";
var Help = class {
  constructor() {
    this.helpWidth = void 0;
    this.minWidthToWrap = 40;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }
  /**
   * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
   * and just before calling `formatHelp()`.
   *
   * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
   *
   * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
   */
  prepareContext(contextOptions) {
    this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
  }
  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */
  visibleCommands(cmd) {
    const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
    const helpCommand = cmd._getHelpCommand();
    if (helpCommand && !helpCommand._hidden) {
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }
  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns {number}
   */
  compareOptions(a, b) {
    const getSortKey = (option) => {
      return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }
  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleOptions(cmd) {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    const helpOption = cmd._getHelpOption();
    if (helpOption && !helpOption.hidden) {
      const removeShort = helpOption.short && cmd._findOption(helpOption.short);
      const removeLong = helpOption.long && cmd._findOption(helpOption.long);
      if (!removeShort && !removeLong) {
        visibleOptions.push(helpOption);
      } else if (helpOption.long && !removeLong) {
        visibleOptions.push(
          cmd.createOption(helpOption.long, helpOption.description)
        );
      } else if (helpOption.short && !removeShort) {
        visibleOptions.push(
          cmd.createOption(helpOption.short, helpOption.description)
        );
      }
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }
  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleGlobalOptions(cmd) {
    if (!this.showGlobalOptions) return [];
    const globalOptions = [];
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      const visibleOptions = ancestorCmd.options.filter(
        (option) => !option.hidden
      );
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }
  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */
  visibleArguments(cmd) {
    if (cmd._argsDescription) {
      cmd.registeredArguments.forEach((argument) => {
        argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
      });
    }
    if (cmd.registeredArguments.find((argument) => argument.description)) {
      return cmd.registeredArguments;
    }
    return [];
  }
  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandTerm(cmd) {
    const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
    return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
    (args ? " " + args : "");
  }
  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */
  optionTerm(option) {
    return option.flags;
  }
  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */
  argumentTerm(argument) {
    return argument.name();
  }
  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestSubcommandTermLength(cmd, helper) {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleSubcommandTerm(helper.subcommandTerm(command))
        )
      );
    }, 0);
  }
  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestOptionTermLength(cmd, helper) {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
      );
    }, 0);
  }
  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestGlobalOptionTermLength(cmd, helper) {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
      );
    }, 0);
  }
  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestArgumentTermLength(cmd, helper) {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleArgumentTerm(helper.argumentTerm(argument))
        )
      );
    }, 0);
  }
  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandUsage(cmd) {
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + "|" + cmd._aliases[0];
    }
    let ancestorCmdNames = "";
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
    }
    return ancestorCmdNames + cmdName + " " + cmd.usage();
  }
  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandDescription(cmd) {
    return cmd.description();
  }
  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandDescription(cmd) {
    return cmd.summary() || cmd.description();
  }
  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */
  optionDescription(option) {
    const extraInfo = [];
    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
      );
    }
    if (option.defaultValue !== void 0) {
      const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
      if (showDefault) {
        extraInfo.push(
          `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
        );
      }
    }
    if (option.presetArg !== void 0 && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== void 0) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (option.description) {
        return `${option.description} ${extraDescription}`;
      }
      return extraDescription;
    }
    return option.description;
  }
  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */
  argumentDescription(argument) {
    const extraInfo = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
      );
    }
    if (argument.defaultValue !== void 0) {
      extraInfo.push(
        `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
      );
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (argument.description) {
        return `${argument.description} ${extraDescription}`;
      }
      return extraDescription;
    }
    return argument.description;
  }
  /**
   * Format a list of items, given a heading and an array of formatted items.
   *
   * @param {string} heading
   * @param {string[]} items
   * @param {Help} helper
   * @returns string[]
   */
  formatItemList(heading, items, helper) {
    if (items.length === 0) return [];
    return [helper.styleTitle(heading), ...items, ""];
  }
  /**
   * Group items by their help group heading.
   *
   * @param {Command[] | Option[]} unsortedItems
   * @param {Command[] | Option[]} visibleItems
   * @param {Function} getGroup
   * @returns {Map<string, Command[] | Option[]>}
   */
  groupItems(unsortedItems, visibleItems, getGroup) {
    const result = /* @__PURE__ */ new Map();
    unsortedItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) result.set(group, []);
    });
    visibleItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) {
        result.set(group, []);
      }
      result.get(group).push(item);
    });
    return result;
  }
  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */
  formatHelp(cmd, helper) {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth ?? 80;
    function callFormatItem(term, description) {
      return helper.formatItem(term, termWidth, description, helper);
    }
    let output = [
      `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
      ""
    ];
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([
        helper.boxWrap(
          helper.styleCommandDescription(commandDescription),
          helpWidth
        ),
        ""
      ]);
    }
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return callFormatItem(
        helper.styleArgumentTerm(helper.argumentTerm(argument)),
        helper.styleArgumentDescription(helper.argumentDescription(argument))
      );
    });
    output = output.concat(
      this.formatItemList("Arguments:", argumentList, helper)
    );
    const optionGroups = this.groupItems(
      cmd.options,
      helper.visibleOptions(cmd),
      (option) => option.helpGroupHeading ?? "Options:"
    );
    optionGroups.forEach((options, group) => {
      const optionList = options.map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option))
        );
      });
      output = output.concat(this.formatItemList(group, optionList, helper));
    });
    if (helper.showGlobalOptions) {
      const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option))
        );
      });
      output = output.concat(
        this.formatItemList("Global Options:", globalOptionList, helper)
      );
    }
    const commandGroups = this.groupItems(
      cmd.commands,
      helper.visibleCommands(cmd),
      (sub) => sub.helpGroup() || "Commands:"
    );
    commandGroups.forEach((commands, group) => {
      const commandList = commands.map((sub) => {
        return callFormatItem(
          helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
          helper.styleSubcommandDescription(helper.subcommandDescription(sub))
        );
      });
      output = output.concat(this.formatItemList(group, commandList, helper));
    });
    return output.join("\n");
  }
  /**
   * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
   *
   * @param {string} str
   * @returns {number}
   */
  displayWidth(str) {
    return stripVTControlCharacters(str).length;
  }
  /**
   * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
   *
   * @param {string} str
   * @returns {string}
   */
  styleTitle(str) {
    return str;
  }
  styleUsage(str) {
    return str.split(" ").map((word) => {
      if (word === "[options]") return this.styleOptionText(word);
      if (word === "[command]") return this.styleSubcommandText(word);
      if (word[0] === "[" || word[0] === "<")
        return this.styleArgumentText(word);
      return this.styleCommandText(word);
    }).join(" ");
  }
  styleCommandDescription(str) {
    return this.styleDescriptionText(str);
  }
  styleOptionDescription(str) {
    return this.styleDescriptionText(str);
  }
  styleSubcommandDescription(str) {
    return this.styleDescriptionText(str);
  }
  styleArgumentDescription(str) {
    return this.styleDescriptionText(str);
  }
  styleDescriptionText(str) {
    return str;
  }
  styleOptionTerm(str) {
    return this.styleOptionText(str);
  }
  styleSubcommandTerm(str) {
    return str.split(" ").map((word) => {
      if (word === "[options]") return this.styleOptionText(word);
      if (word[0] === "[" || word[0] === "<")
        return this.styleArgumentText(word);
      return this.styleSubcommandText(word);
    }).join(" ");
  }
  styleArgumentTerm(str) {
    return this.styleArgumentText(str);
  }
  styleOptionText(str) {
    return str;
  }
  styleArgumentText(str) {
    return str;
  }
  styleSubcommandText(str) {
    return str;
  }
  styleCommandText(str) {
    return str;
  }
  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  padWidth(cmd, helper) {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper)
    );
  }
  /**
   * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
   *
   * @param {string} str
   * @returns {boolean}
   */
  preformatted(str) {
    return /\n[^\S\r\n]/.test(str);
  }
  /**
   * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
   *
   * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
   *   TTT  DDD DDDD
   *        DD DDD
   *
   * @param {string} term
   * @param {number} termWidth
   * @param {string} description
   * @param {Help} helper
   * @returns {string}
   */
  formatItem(term, termWidth, description, helper) {
    const itemIndent = 2;
    const itemIndentStr = " ".repeat(itemIndent);
    if (!description) return itemIndentStr + term;
    const paddedTerm = term.padEnd(
      termWidth + term.length - helper.displayWidth(term)
    );
    const spacerWidth = 2;
    const helpWidth = this.helpWidth ?? 80;
    const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
    let formattedDescription;
    if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
      formattedDescription = description;
    } else {
      const wrappedDescription = helper.boxWrap(description, remainingWidth);
      formattedDescription = wrappedDescription.replace(
        /\n/g,
        "\n" + " ".repeat(termWidth + spacerWidth)
      );
    }
    return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
  }
  /**
   * Wrap a string at whitespace, preserving existing line breaks.
   * Wrapping is skipped if the width is less than `minWidthToWrap`.
   *
   * @param {string} str
   * @param {number} width
   * @returns {string}
   */
  boxWrap(str, width) {
    if (width < this.minWidthToWrap) return str;
    const rawLines = str.split(/\r\n|\n/);
    const chunkPattern = /[\s]*[^\s]+/g;
    const wrappedLines = [];
    rawLines.forEach((line) => {
      const chunks = line.match(chunkPattern);
      if (chunks === null) {
        wrappedLines.push("");
        return;
      }
      let sumChunks = [chunks.shift()];
      let sumWidth = this.displayWidth(sumChunks[0]);
      chunks.forEach((chunk) => {
        const visibleWidth = this.displayWidth(chunk);
        if (sumWidth + visibleWidth <= width) {
          sumChunks.push(chunk);
          sumWidth += visibleWidth;
          return;
        }
        wrappedLines.push(sumChunks.join(""));
        const nextChunk = chunk.trimStart();
        sumChunks = [nextChunk];
        sumWidth = this.displayWidth(nextChunk);
      });
      wrappedLines.push(sumChunks.join(""));
    });
    return wrappedLines.join("\n");
  }
};

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/option.js
var Option = class {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */
  constructor(flags, description) {
    this.flags = flags;
    this.description = description || "";
    this.required = flags.includes("<");
    this.optional = flags.includes("[");
    this.variadic = /\w\.\.\.[>\]]$/.test(flags);
    this.mandatory = false;
    const optionFlags = splitOptionFlags(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;
    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith("--no-");
    }
    this.defaultValue = void 0;
    this.defaultValueDescription = void 0;
    this.presetArg = void 0;
    this.envVar = void 0;
    this.parseArg = void 0;
    this.hidden = false;
    this.argChoices = void 0;
    this.conflictsWith = [];
    this.implied = void 0;
    this.helpGroupHeading = void 0;
  }
  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Option}
   */
  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }
  /**
   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
   * The custom processing (parseArg) is called.
   *
   * @example
   * new Option('--color').default('GREYSCALE').preset('RGB');
   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
   *
   * @param {*} arg
   * @return {Option}
   */
  preset(arg) {
    this.presetArg = arg;
    return this;
  }
  /**
   * Add option name(s) that conflict with this option.
   * An error will be displayed if conflicting options are found during parsing.
   *
   * @example
   * new Option('--rgb').conflicts('cmyk');
   * new Option('--js').conflicts(['ts', 'jsx']);
   *
   * @param {(string | string[])} names
   * @return {Option}
   */
  conflicts(names) {
    this.conflictsWith = this.conflictsWith.concat(names);
    return this;
  }
  /**
   * Specify implied option values for when this option is set and the implied options are not.
   *
   * The custom processing (parseArg) is not called on the implied values.
   *
   * @example
   * program
   *   .addOption(new Option('--log', 'write logging information to file'))
   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
   *
   * @param {object} impliedOptionValues
   * @return {Option}
   */
  implies(impliedOptionValues) {
    let newImplied = impliedOptionValues;
    if (typeof impliedOptionValues === "string") {
      newImplied = { [impliedOptionValues]: true };
    }
    this.implied = Object.assign(this.implied || {}, newImplied);
    return this;
  }
  /**
   * Set environment variable to check for option value.
   *
   * An environment variable is only used if when processed the current option value is
   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
   *
   * @param {string} name
   * @return {Option}
   */
  env(name) {
    this.envVar = name;
    return this;
  }
  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */
  argParser(fn2) {
    this.parseArg = fn2;
    return this;
  }
  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */
  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }
  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */
  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }
  /**
   * @package
   */
  _collectValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }
    previous.push(value);
    return previous;
  }
  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */
  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(
          `Allowed choices are ${this.argChoices.join(", ")}.`
        );
      }
      if (this.variadic) {
        return this._collectValue(arg, previous);
      }
      return arg;
    };
    return this;
  }
  /**
   * Return option name.
   *
   * @return {string}
   */
  name() {
    if (this.long) {
      return this.long.replace(/^--/, "");
    }
    return this.short.replace(/^-/, "");
  }
  /**
   * Return option name, in a camelcase format that can be used
   * as an object attribute key.
   *
   * @return {string}
   */
  attributeName() {
    if (this.negate) {
      return camelcase(this.name().replace(/^no-/, ""));
    }
    return camelcase(this.name());
  }
  /**
   * Set the help group heading.
   *
   * @param {string} heading
   * @return {Option}
   */
  helpGroup(heading) {
    this.helpGroupHeading = heading;
    return this;
  }
  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @package
   */
  is(arg) {
    return this.short === arg || this.long === arg;
  }
  /**
   * Return whether a boolean option.
   *
   * Options are one of boolean, negated, required argument, or optional argument.
   *
   * @return {boolean}
   * @package
   */
  isBoolean() {
    return !this.required && !this.optional && !this.negate;
  }
};
var DualOptions = class {
  /**
   * @param {Option[]} options
   */
  constructor(options) {
    this.positiveOptions = /* @__PURE__ */ new Map();
    this.negativeOptions = /* @__PURE__ */ new Map();
    this.dualOptions = /* @__PURE__ */ new Set();
    options.forEach((option) => {
      if (option.negate) {
        this.negativeOptions.set(option.attributeName(), option);
      } else {
        this.positiveOptions.set(option.attributeName(), option);
      }
    });
    this.negativeOptions.forEach((value, key) => {
      if (this.positiveOptions.has(key)) {
        this.dualOptions.add(key);
      }
    });
  }
  /**
   * Did the value come from the option, and not from possible matching dual option?
   *
   * @param {*} value
   * @param {Option} option
   * @returns {boolean}
   */
  valueFromOption(value, option) {
    const optionKey = option.attributeName();
    if (!this.dualOptions.has(optionKey)) return true;
    const preset = this.negativeOptions.get(optionKey).presetArg;
    const negativeValue = preset !== void 0 ? preset : false;
    return option.negate === (negativeValue === value);
  }
};
function camelcase(str) {
  return str.split("-").reduce((str2, word) => {
    return str2 + word[0].toUpperCase() + word.slice(1);
  });
}
function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;
  const shortFlagExp = /^-[^-]$/;
  const longFlagExp = /^--[^-]/;
  const flagParts = flags.split(/[ |,]+/).concat("guard");
  if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
  if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
  if (!shortFlag && shortFlagExp.test(flagParts[0]))
    shortFlag = flagParts.shift();
  if (!shortFlag && longFlagExp.test(flagParts[0])) {
    shortFlag = longFlag;
    longFlag = flagParts.shift();
  }
  if (flagParts[0].startsWith("-")) {
    const unsupportedFlag = flagParts[0];
    const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
    if (/^-[^-][^-]/.test(unsupportedFlag))
      throw new Error(
        `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
      );
    if (shortFlagExp.test(unsupportedFlag))
      throw new Error(`${baseError}
- too many short flags`);
    if (longFlagExp.test(unsupportedFlag))
      throw new Error(`${baseError}
- too many long flags`);
    throw new Error(`${baseError}
- unrecognised flag format`);
  }
  if (shortFlag === void 0 && longFlag === void 0)
    throw new Error(
      `option creation failed due to no flags found in '${flags}'.`
    );
  return { shortFlag, longFlag };
}

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/suggestSimilar.js
var maxDistance = 3;
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > maxDistance)
    return Math.max(a.length, b.length);
  const d = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (let j2 = 0; j2 <= b.length; j2++) {
    d[0][j2] = j2;
  }
  for (let j2 = 1; j2 <= b.length; j2++) {
    for (let i = 1; i <= a.length; i++) {
      let cost;
      if (a[i - 1] === b[j2 - 1]) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j2] = Math.min(
        d[i - 1][j2] + 1,
        // deletion
        d[i][j2 - 1] + 1,
        // insertion
        d[i - 1][j2 - 1] + cost
        // substitution
      );
      if (i > 1 && j2 > 1 && a[i - 1] === b[j2 - 2] && a[i - 2] === b[j2 - 1]) {
        d[i][j2] = Math.min(d[i][j2], d[i - 2][j2 - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}
function suggestSimilar(word, candidates) {
  if (!candidates || candidates.length === 0) return "";
  candidates = Array.from(new Set(candidates));
  const searchingOptions = word.startsWith("--");
  if (searchingOptions) {
    word = word.slice(2);
    candidates = candidates.map((candidate) => candidate.slice(2));
  }
  let similar = [];
  let bestDistance = maxDistance;
  const minSimilarity = 0.4;
  candidates.forEach((candidate) => {
    if (candidate.length <= 1) return;
    const distance = editDistance(word, candidate);
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > minSimilarity) {
      if (distance < bestDistance) {
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  });
  similar.sort((a, b) => a.localeCompare(b));
  if (searchingOptions) {
    similar = similar.map((candidate) => `--${candidate}`);
  }
  if (similar.length > 1) {
    return `
(Did you mean one of ${similar.join(", ")}?)`;
  }
  if (similar.length === 1) {
    return `
(Did you mean ${similar[0]}?)`;
  }
  return "";
}

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/command.js
var Command = class _Command extends EventEmitter {
  /**
   * Initialize a new `Command`.
   *
   * @param {string} [name]
   */
  constructor(name) {
    super();
    this.commands = [];
    this.options = [];
    this.parent = null;
    this._allowUnknownOption = false;
    this._allowExcessArguments = false;
    this.registeredArguments = [];
    this._args = this.registeredArguments;
    this.args = [];
    this.rawArgs = [];
    this.processedArgs = [];
    this._scriptPath = null;
    this._name = name || "";
    this._optionValues = {};
    this._optionValueSources = {};
    this._storeOptionsAsProperties = false;
    this._actionHandler = null;
    this._executableHandler = false;
    this._executableFile = null;
    this._executableDir = null;
    this._defaultCommandName = null;
    this._exitCallback = null;
    this._aliases = [];
    this._combineFlagAndOptionalValue = true;
    this._description = "";
    this._summary = "";
    this._argsDescription = void 0;
    this._enablePositionalOptions = false;
    this._passThroughOptions = false;
    this._lifeCycleHooks = {};
    this._showHelpAfterError = false;
    this._showSuggestionAfterError = true;
    this._savedState = null;
    this._outputConfiguration = {
      writeOut: (str) => process2.stdout.write(str),
      writeErr: (str) => process2.stderr.write(str),
      outputError: (str, write) => write(str),
      getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
      getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
      getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
      getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
      stripColor: (str) => stripVTControlCharacters2(str)
    };
    this._hidden = false;
    this._helpOption = void 0;
    this._addImplicitHelpCommand = void 0;
    this._helpCommand = void 0;
    this._helpConfiguration = {};
    this._helpGroupHeading = void 0;
    this._defaultCommandGroup = void 0;
    this._defaultOptionGroup = void 0;
  }
  /**
   * Copy settings that are useful to have in common across root command and subcommands.
   *
   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
   *
   * @param {Command} sourceCommand
   * @return {Command} `this` command for chaining
   */
  copyInheritedSettings(sourceCommand) {
    this._outputConfiguration = sourceCommand._outputConfiguration;
    this._helpOption = sourceCommand._helpOption;
    this._helpCommand = sourceCommand._helpCommand;
    this._helpConfiguration = sourceCommand._helpConfiguration;
    this._exitCallback = sourceCommand._exitCallback;
    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
    this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
    this._allowExcessArguments = sourceCommand._allowExcessArguments;
    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
    this._showHelpAfterError = sourceCommand._showHelpAfterError;
    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
    return this;
  }
  /**
   * @returns {Command[]}
   * @private
   */
  _getCommandAndAncestors() {
    const result = [];
    for (let command = this; command; command = command.parent) {
      result.push(command);
    }
    return result;
  }
  /**
   * Define a command.
   *
   * There are two styles of command: pay attention to where to put the description.
   *
   * @example
   * // Command implemented using action handler (description is supplied separately to `.command`)
   * program
   *   .command('clone <source> [destination]')
   *   .description('clone a repository into a newly created directory')
   *   .action((source, destination) => {
   *     console.log('clone command called');
   *   });
   *
   * // Command implemented using separate executable file (description is second parameter to `.command`)
   * program
   *   .command('start <service>', 'start named service')
   *   .command('stop [service]', 'stop named service, or all if no name supplied');
   *
   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
   * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
   * @param {object} [execOpts] - configuration options (for executable)
   * @return {Command} returns new command for action handler, or `this` for executable command
   */
  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
    let desc = actionOptsOrExecDesc;
    let opts = execOpts;
    if (typeof desc === "object" && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
    const cmd = this.createCommand(name);
    if (desc) {
      cmd.description(desc);
      cmd._executableHandler = true;
    }
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    cmd._hidden = !!(opts.noHelp || opts.hidden);
    cmd._executableFile = opts.executableFile || null;
    if (args) cmd.arguments(args);
    this._registerCommand(cmd);
    cmd.parent = this;
    cmd.copyInheritedSettings(this);
    if (desc) return this;
    return cmd;
  }
  /**
   * Factory routine to create a new unattached command.
   *
   * See .command() for creating an attached subcommand, which uses this routine to
   * create the command. You can override createCommand to customise subcommands.
   *
   * @param {string} [name]
   * @return {Command} new command
   */
  createCommand(name) {
    return new _Command(name);
  }
  /**
   * You can customise the help with a subclass of Help by overriding createHelp,
   * or by overriding Help properties using configureHelp().
   *
   * @return {Help}
   */
  createHelp() {
    return Object.assign(new Help(), this.configureHelp());
  }
  /**
   * You can customise the help by overriding Help properties using configureHelp(),
   * or with a subclass of Help by overriding createHelp().
   *
   * @param {object} [configuration] - configuration options
   * @return {(Command | object)} `this` command for chaining, or stored configuration
   */
  configureHelp(configuration) {
    if (configuration === void 0) return this._helpConfiguration;
    this._helpConfiguration = configuration;
    return this;
  }
  /**
   * The default output goes to stdout and stderr. You can customise this for special
   * applications. You can also customise the display of errors by overriding outputError.
   *
   * The configuration properties are all functions:
   *
   *     // change how output being written, defaults to stdout and stderr
   *     writeOut(str)
   *     writeErr(str)
   *     // change how output being written for errors, defaults to writeErr
   *     outputError(str, write) // used for displaying errors and not used for displaying help
   *     // specify width for wrapping help
   *     getOutHelpWidth()
   *     getErrHelpWidth()
   *     // color support, currently only used with Help
   *     getOutHasColors()
   *     getErrHasColors()
   *     stripColor() // used to remove ANSI escape codes if output does not have colors
   *
   * @param {object} [configuration] - configuration options
   * @return {(Command | object)} `this` command for chaining, or stored configuration
   */
  configureOutput(configuration) {
    if (configuration === void 0) return this._outputConfiguration;
    this._outputConfiguration = {
      ...this._outputConfiguration,
      ...configuration
    };
    return this;
  }
  /**
   * Display the help or a custom message after an error occurs.
   *
   * @param {(boolean|string)} [displayHelp]
   * @return {Command} `this` command for chaining
   */
  showHelpAfterError(displayHelp = true) {
    if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
    this._showHelpAfterError = displayHelp;
    return this;
  }
  /**
   * Display suggestion of similar commands for unknown commands, or options for unknown options.
   *
   * @param {boolean} [displaySuggestion]
   * @return {Command} `this` command for chaining
   */
  showSuggestionAfterError(displaySuggestion = true) {
    this._showSuggestionAfterError = !!displaySuggestion;
    return this;
  }
  /**
   * Add a prepared subcommand.
   *
   * See .command() for creating an attached subcommand which inherits settings from its parent.
   *
   * @param {Command} cmd - new subcommand
   * @param {object} [opts] - configuration options
   * @return {Command} `this` command for chaining
   */
  addCommand(cmd, opts) {
    if (!cmd._name) {
      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
    }
    opts = opts || {};
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    if (opts.noHelp || opts.hidden) cmd._hidden = true;
    this._registerCommand(cmd);
    cmd.parent = this;
    cmd._checkForBrokenPassThrough();
    return this;
  }
  /**
   * Factory routine to create a new unattached argument.
   *
   * See .argument() for creating an attached argument, which uses this routine to
   * create the argument. You can override createArgument to return a custom argument.
   *
   * @param {string} name
   * @param {string} [description]
   * @return {Argument} new argument
   */
  createArgument(name, description) {
    return new Argument(name, description);
  }
  /**
   * Define argument syntax for command.
   *
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @example
   * program.argument('<input-file>');
   * program.argument('[output-file]');
   *
   * @param {string} name
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom argument processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  argument(name, description, parseArg, defaultValue) {
    const argument = this.createArgument(name, description);
    if (typeof parseArg === "function") {
      argument.default(defaultValue).argParser(parseArg);
    } else {
      argument.default(parseArg);
    }
    this.addArgument(argument);
    return this;
  }
  /**
   * Define argument syntax for command, adding multiple at once (without descriptions).
   *
   * See also .argument().
   *
   * @example
   * program.arguments('<cmd> [env]');
   *
   * @param {string} names
   * @return {Command} `this` command for chaining
   */
  arguments(names) {
    names.trim().split(/ +/).forEach((detail) => {
      this.argument(detail);
    });
    return this;
  }
  /**
   * Define argument syntax for command, adding a prepared argument.
   *
   * @param {Argument} argument
   * @return {Command} `this` command for chaining
   */
  addArgument(argument) {
    const previousArgument = this.registeredArguments.slice(-1)[0];
    if (previousArgument?.variadic) {
      throw new Error(
        `only the last argument can be variadic '${previousArgument.name()}'`
      );
    }
    if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
      throw new Error(
        `a default value for a required argument is never used: '${argument.name()}'`
      );
    }
    this.registeredArguments.push(argument);
    return this;
  }
  /**
   * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
   *
   * @example
   *    program.helpCommand('help [cmd]');
   *    program.helpCommand('help [cmd]', 'show help');
   *    program.helpCommand(false); // suppress default help command
   *    program.helpCommand(true); // add help command even if no subcommands
   *
   * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
   * @param {string} [description] - custom description
   * @return {Command} `this` command for chaining
   */
  helpCommand(enableOrNameAndArgs, description) {
    if (typeof enableOrNameAndArgs === "boolean") {
      this._addImplicitHelpCommand = enableOrNameAndArgs;
      if (enableOrNameAndArgs && this._defaultCommandGroup) {
        this._initCommandGroup(this._getHelpCommand());
      }
      return this;
    }
    const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
    const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
    const helpDescription = description ?? "display help for command";
    const helpCommand = this.createCommand(helpName);
    helpCommand.helpOption(false);
    if (helpArgs) helpCommand.arguments(helpArgs);
    if (helpDescription) helpCommand.description(helpDescription);
    this._addImplicitHelpCommand = true;
    this._helpCommand = helpCommand;
    if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
    return this;
  }
  /**
   * Add prepared custom help command.
   *
   * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
   * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
   * @return {Command} `this` command for chaining
   */
  addHelpCommand(helpCommand, deprecatedDescription) {
    if (typeof helpCommand !== "object") {
      this.helpCommand(helpCommand, deprecatedDescription);
      return this;
    }
    this._addImplicitHelpCommand = true;
    this._helpCommand = helpCommand;
    this._initCommandGroup(helpCommand);
    return this;
  }
  /**
   * Lazy create help command.
   *
   * @return {(Command|null)}
   * @package
   */
  _getHelpCommand() {
    const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
    if (hasImplicitHelpCommand) {
      if (this._helpCommand === void 0) {
        this.helpCommand(void 0, void 0);
      }
      return this._helpCommand;
    }
    return null;
  }
  /**
   * Add hook for life cycle event.
   *
   * @param {string} event
   * @param {Function} listener
   * @return {Command} `this` command for chaining
   */
  hook(event, listener) {
    const allowedValues = ["preSubcommand", "preAction", "postAction"];
    if (!allowedValues.includes(event)) {
      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    if (this._lifeCycleHooks[event]) {
      this._lifeCycleHooks[event].push(listener);
    } else {
      this._lifeCycleHooks[event] = [listener];
    }
    return this;
  }
  /**
   * Register callback to use as replacement for calling process.exit.
   *
   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
   * @return {Command} `this` command for chaining
   */
  exitOverride(fn2) {
    if (fn2) {
      this._exitCallback = fn2;
    } else {
      this._exitCallback = (err) => {
        if (err.code !== "commander.executeSubCommandAsync") {
          throw err;
        } else {
        }
      };
    }
    return this;
  }
  /**
   * Call process.exit, and _exitCallback if defined.
   *
   * @param {number} exitCode exit code for using with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @return never
   * @private
   */
  _exit(exitCode, code, message) {
    if (this._exitCallback) {
      this._exitCallback(new CommanderError(exitCode, code, message));
    }
    process2.exit(exitCode);
  }
  /**
   * Register callback `fn` for the command.
   *
   * @example
   * program
   *   .command('serve')
   *   .description('start service')
   *   .action(function() {
   *      // do work here
   *   });
   *
   * @param {Function} fn
   * @return {Command} `this` command for chaining
   */
  action(fn2) {
    const listener = (args) => {
      const expectedArgsCount = this.registeredArguments.length;
      const actionArgs = args.slice(0, expectedArgsCount);
      if (this._storeOptionsAsProperties) {
        actionArgs[expectedArgsCount] = this;
      } else {
        actionArgs[expectedArgsCount] = this.opts();
      }
      actionArgs.push(this);
      return fn2.apply(this, actionArgs);
    };
    this._actionHandler = listener;
    return this;
  }
  /**
   * Factory routine to create a new unattached option.
   *
   * See .option() for creating an attached option, which uses this routine to
   * create the option. You can override createOption to return a custom option.
   *
   * @param {string} flags
   * @param {string} [description]
   * @return {Option} new option
   */
  createOption(flags, description) {
    return new Option(flags, description);
  }
  /**
   * Wrap parseArgs to catch 'commander.invalidArgument'.
   *
   * @param {(Option | Argument)} target
   * @param {string} value
   * @param {*} previous
   * @param {string} invalidArgumentMessage
   * @private
   */
  _callParseArg(target, value, previous, invalidArgumentMessage) {
    try {
      return target.parseArg(value, previous);
    } catch (err) {
      if (err.code === "commander.invalidArgument") {
        const message = `${invalidArgumentMessage} ${err.message}`;
        this.error(message, { exitCode: err.exitCode, code: err.code });
      }
      throw err;
    }
  }
  /**
   * Check for option flag conflicts.
   * Register option if no conflicts found, or throw on conflict.
   *
   * @param {Option} option
   * @private
   */
  _registerOption(option) {
    const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
    if (matchingOption) {
      const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
      throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
    }
    this._initOptionGroup(option);
    this.options.push(option);
  }
  /**
   * Check for command name and alias conflicts with existing commands.
   * Register command if no conflicts found, or throw on conflict.
   *
   * @param {Command} command
   * @private
   */
  _registerCommand(command) {
    const knownBy = (cmd) => {
      return [cmd.name()].concat(cmd.aliases());
    };
    const alreadyUsed = knownBy(command).find(
      (name) => this._findCommand(name)
    );
    if (alreadyUsed) {
      const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
      const newCmd = knownBy(command).join("|");
      throw new Error(
        `cannot add command '${newCmd}' as already have command '${existingCmd}'`
      );
    }
    this._initCommandGroup(command);
    this.commands.push(command);
  }
  /**
   * Add an option.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addOption(option) {
    this._registerOption(option);
    const oname = option.name();
    const name = option.attributeName();
    if (option.defaultValue !== void 0) {
      this.setOptionValueWithSource(name, option.defaultValue, "default");
    }
    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
      if (val == null && option.presetArg !== void 0) {
        val = option.presetArg;
      }
      const oldValue = this.getOptionValue(name);
      if (val !== null && option.parseArg) {
        val = this._callParseArg(option, val, oldValue, invalidValueMessage);
      } else if (val !== null && option.variadic) {
        val = option._collectValue(val, oldValue);
      }
      if (val == null) {
        if (option.negate) {
          val = false;
        } else if (option.isBoolean() || option.optional) {
          val = true;
        } else {
          val = "";
        }
      }
      this.setOptionValueWithSource(name, val, valueSource);
    };
    this.on("option:" + oname, (val) => {
      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
      handleOptionValue(val, invalidValueMessage, "cli");
    });
    if (option.envVar) {
      this.on("optionEnv:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "env");
      });
    }
    return this;
  }
  /**
   * Internal implementation shared by .option() and .requiredOption()
   *
   * @return {Command} `this` command for chaining
   * @private
   */
  _optionEx(config, flags, description, fn2, defaultValue) {
    if (typeof flags === "object" && flags instanceof Option) {
      throw new Error(
        "To add an Option object use addOption() instead of option() or requiredOption()"
      );
    }
    const option = this.createOption(flags, description);
    option.makeOptionMandatory(!!config.mandatory);
    if (typeof fn2 === "function") {
      option.default(defaultValue).argParser(fn2);
    } else if (fn2 instanceof RegExp) {
      const regex = fn2;
      fn2 = (val, def) => {
        const m = regex.exec(val);
        return m ? m[0] : def;
      };
      option.default(defaultValue).argParser(fn2);
    } else {
      option.default(fn2);
    }
    return this.addOption(option);
  }
  /**
   * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
   *
   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
   * option-argument is indicated by `<>` and an optional option-argument by `[]`.
   *
   * See the README for more details, and see also addOption() and requiredOption().
   *
   * @example
   * program
   *     .option('-p, --pepper', 'add pepper')
   *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
   *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
   *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  option(flags, description, parseArg, defaultValue) {
    return this._optionEx({}, flags, description, parseArg, defaultValue);
  }
  /**
   * Add a required option which must have a value after parsing. This usually means
   * the option must be specified on the command line. (Otherwise the same as .option().)
   *
   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  requiredOption(flags, description, parseArg, defaultValue) {
    return this._optionEx(
      { mandatory: true },
      flags,
      description,
      parseArg,
      defaultValue
    );
  }
  /**
   * Alter parsing of short flags with optional values.
   *
   * @example
   * // for `.option('-f,--flag [value]'):
   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
   *
   * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
   * @return {Command} `this` command for chaining
   */
  combineFlagAndOptionalValue(combine = true) {
    this._combineFlagAndOptionalValue = !!combine;
    return this;
  }
  /**
   * Allow unknown options on the command line.
   *
   * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
   * @return {Command} `this` command for chaining
   */
  allowUnknownOption(allowUnknown = true) {
    this._allowUnknownOption = !!allowUnknown;
    return this;
  }
  /**
   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
   *
   * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
   * @return {Command} `this` command for chaining
   */
  allowExcessArguments(allowExcess = true) {
    this._allowExcessArguments = !!allowExcess;
    return this;
  }
  /**
   * Enable positional options. Positional means global options are specified before subcommands which lets
   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
   * The default behaviour is non-positional and global options may appear anywhere on the command line.
   *
   * @param {boolean} [positional]
   * @return {Command} `this` command for chaining
   */
  enablePositionalOptions(positional = true) {
    this._enablePositionalOptions = !!positional;
    return this;
  }
  /**
   * Pass through options that come after command-arguments rather than treat them as command-options,
   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
   * positional options to have been enabled on the program (parent commands).
   * The default behaviour is non-positional and options may appear before or after command-arguments.
   *
   * @param {boolean} [passThrough] for unknown options.
   * @return {Command} `this` command for chaining
   */
  passThroughOptions(passThrough = true) {
    this._passThroughOptions = !!passThrough;
    this._checkForBrokenPassThrough();
    return this;
  }
  /**
   * @private
   */
  _checkForBrokenPassThrough() {
    if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
      throw new Error(
        `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
      );
    }
  }
  /**
   * Whether to store option values as properties on command object,
   * or store separately (specify false). In both cases the option values can be accessed using .opts().
   *
   * @param {boolean} [storeAsProperties=true]
   * @return {Command} `this` command for chaining
   */
  storeOptionsAsProperties(storeAsProperties = true) {
    if (this.options.length) {
      throw new Error("call .storeOptionsAsProperties() before adding options");
    }
    if (Object.keys(this._optionValues).length) {
      throw new Error(
        "call .storeOptionsAsProperties() before setting option values"
      );
    }
    this._storeOptionsAsProperties = !!storeAsProperties;
    return this;
  }
  /**
   * Retrieve option value.
   *
   * @param {string} key
   * @return {object} value
   */
  getOptionValue(key) {
    if (this._storeOptionsAsProperties) {
      return this[key];
    }
    return this._optionValues[key];
  }
  /**
   * Store option value.
   *
   * @param {string} key
   * @param {object} value
   * @return {Command} `this` command for chaining
   */
  setOptionValue(key, value) {
    return this.setOptionValueWithSource(key, value, void 0);
  }
  /**
   * Store option value and where the value came from.
   *
   * @param {string} key
   * @param {object} value
   * @param {string} source - expected values are default/config/env/cli/implied
   * @return {Command} `this` command for chaining
   */
  setOptionValueWithSource(key, value, source) {
    if (this._storeOptionsAsProperties) {
      this[key] = value;
    } else {
      this._optionValues[key] = value;
    }
    this._optionValueSources[key] = source;
    return this;
  }
  /**
   * Get source of option value.
   * Expected values are default | config | env | cli | implied
   *
   * @param {string} key
   * @return {string}
   */
  getOptionValueSource(key) {
    return this._optionValueSources[key];
  }
  /**
   * Get source of option value. See also .optsWithGlobals().
   * Expected values are default | config | env | cli | implied
   *
   * @param {string} key
   * @return {string}
   */
  getOptionValueSourceWithGlobals(key) {
    let source;
    this._getCommandAndAncestors().forEach((cmd) => {
      if (cmd.getOptionValueSource(key) !== void 0) {
        source = cmd.getOptionValueSource(key);
      }
    });
    return source;
  }
  /**
   * Get user arguments from implied or explicit arguments.
   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
   *
   * @private
   */
  _prepareUserArgs(argv, parseOptions) {
    if (argv !== void 0 && !Array.isArray(argv)) {
      throw new Error("first parameter to parse must be array or undefined");
    }
    parseOptions = parseOptions || {};
    if (argv === void 0 && parseOptions.from === void 0) {
      if (process2.versions?.electron) {
        parseOptions.from = "electron";
      }
      const execArgv = process2.execArgv ?? [];
      if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
        parseOptions.from = "eval";
      }
    }
    if (argv === void 0) {
      argv = process2.argv;
    }
    this.rawArgs = argv.slice();
    let userArgs;
    switch (parseOptions.from) {
      case void 0:
      case "node":
        this._scriptPath = argv[1];
        userArgs = argv.slice(2);
        break;
      case "electron":
        if (process2.defaultApp) {
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
        } else {
          userArgs = argv.slice(1);
        }
        break;
      case "user":
        userArgs = argv.slice(0);
        break;
      case "eval":
        userArgs = argv.slice(1);
        break;
      default:
        throw new Error(
          `unexpected parse option { from: '${parseOptions.from}' }`
        );
    }
    if (!this._name && this._scriptPath)
      this.nameFromFilename(this._scriptPath);
    this._name = this._name || "program";
    return userArgs;
  }
  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Use parseAsync instead of parse if any of your action handlers are async.
   *
   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
   *
   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
   * - `'user'`: just user arguments
   *
   * @example
   * program.parse(); // parse process.argv and auto-detect electron and special node flags
   * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv] - optional, defaults to process.argv
   * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
   * @return {Command} `this` command for chaining
   */
  parse(argv, parseOptions) {
    this._prepareForParse();
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    this._parseCommand([], userArgs);
    return this;
  }
  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
   *
   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
   * - `'user'`: just user arguments
   *
   * @example
   * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
   * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv]
   * @param {object} [parseOptions]
   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
   * @return {Promise}
   */
  async parseAsync(argv, parseOptions) {
    this._prepareForParse();
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    await this._parseCommand([], userArgs);
    return this;
  }
  _prepareForParse() {
    if (this._savedState === null) {
      this.options.filter(
        (option) => option.negate && option.defaultValue === void 0 && this.getOptionValue(option.attributeName()) === void 0
      ).forEach((option) => {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(
            option.attributeName(),
            true,
            "default"
          );
        }
      });
      this.saveStateBeforeParse();
    } else {
      this.restoreStateBeforeParse();
    }
  }
  /**
   * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
   * Not usually called directly, but available for subclasses to save their custom state.
   *
   * This is called in a lazy way. Only commands used in parsing chain will have state saved.
   */
  saveStateBeforeParse() {
    this._savedState = {
      // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
      _name: this._name,
      // option values before parse have default values (including false for negated options)
      // shallow clones
      _optionValues: { ...this._optionValues },
      _optionValueSources: { ...this._optionValueSources }
    };
  }
  /**
   * Restore state before parse for calls after the first.
   * Not usually called directly, but available for subclasses to save their custom state.
   *
   * This is called in a lazy way. Only commands used in parsing chain will have state restored.
   */
  restoreStateBeforeParse() {
    if (this._storeOptionsAsProperties)
      throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
    this._name = this._savedState._name;
    this._scriptPath = null;
    this.rawArgs = [];
    this._optionValues = { ...this._savedState._optionValues };
    this._optionValueSources = { ...this._savedState._optionValueSources };
    this.args = [];
    this.processedArgs = [];
  }
  /**
   * Throw if expected executable is missing. Add lots of help for author.
   *
   * @param {string} executableFile
   * @param {string} executableDir
   * @param {string} subcommandName
   */
  _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
    if (fs.existsSync(executableFile)) return;
    const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
    const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
    throw new Error(executableMissing);
  }
  /**
   * Execute a sub-command executable.
   *
   * @private
   */
  _executeSubCommand(subcommand, args) {
    args = args.slice();
    const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
    function findFile(baseDir, baseName) {
      const localBin = path.resolve(baseDir, baseName);
      if (fs.existsSync(localBin)) return localBin;
      if (sourceExt.includes(path.extname(baseName))) return void 0;
      const foundExt = sourceExt.find(
        (ext) => fs.existsSync(`${localBin}${ext}`)
      );
      if (foundExt) return `${localBin}${foundExt}`;
      return void 0;
    }
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();
    let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
    let executableDir = this._executableDir || "";
    if (this._scriptPath) {
      let resolvedScriptPath;
      try {
        resolvedScriptPath = fs.realpathSync(this._scriptPath);
      } catch {
        resolvedScriptPath = this._scriptPath;
      }
      executableDir = path.resolve(
        path.dirname(resolvedScriptPath),
        executableDir
      );
    }
    if (executableDir) {
      let localFile = findFile(executableDir, executableFile);
      if (!localFile && !subcommand._executableFile && this._scriptPath) {
        const legacyName = path.basename(
          this._scriptPath,
          path.extname(this._scriptPath)
        );
        if (legacyName !== this._name) {
          localFile = findFile(
            executableDir,
            `${legacyName}-${subcommand._name}`
          );
        }
      }
      executableFile = localFile || executableFile;
    }
    const launchWithNode = sourceExt.includes(path.extname(executableFile));
    let proc;
    if (process2.platform !== "win32") {
      if (launchWithNode) {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
      } else {
        proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
      }
    } else {
      this._checkForMissingExecutable(
        executableFile,
        executableDir,
        subcommand._name
      );
      args.unshift(executableFile);
      args = incrementNodeInspectorPort(process2.execArgv).concat(args);
      proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
    }
    if (!proc.killed) {
      const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
      signals.forEach((signal) => {
        process2.on(signal, () => {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
    }
    const exitCallback = this._exitCallback;
    proc.on("close", (code) => {
      code = code ?? 1;
      if (!exitCallback) {
        process2.exit(code);
      } else {
        exitCallback(
          new CommanderError(
            code,
            "commander.executeSubCommandAsync",
            "(close)"
          )
        );
      }
    });
    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        this._checkForMissingExecutable(
          executableFile,
          executableDir,
          subcommand._name
        );
      } else if (err.code === "EACCES") {
        throw new Error(`'${executableFile}' not executable`);
      }
      if (!exitCallback) {
        process2.exit(1);
      } else {
        const wrappedError = new CommanderError(
          1,
          "commander.executeSubCommandAsync",
          "(error)"
        );
        wrappedError.nestedError = err;
        exitCallback(wrappedError);
      }
    });
    this.runningCommand = proc;
  }
  /**
   * @private
   */
  _dispatchSubcommand(commandName, operands, unknown) {
    const subCommand = this._findCommand(commandName);
    if (!subCommand) this.help({ error: true });
    subCommand._prepareForParse();
    let promiseChain;
    promiseChain = this._chainOrCallSubCommandHook(
      promiseChain,
      subCommand,
      "preSubcommand"
    );
    promiseChain = this._chainOrCall(promiseChain, () => {
      if (subCommand._executableHandler) {
        this._executeSubCommand(subCommand, operands.concat(unknown));
      } else {
        return subCommand._parseCommand(operands, unknown);
      }
    });
    return promiseChain;
  }
  /**
   * Invoke help directly if possible, or dispatch if necessary.
   * e.g. help foo
   *
   * @private
   */
  _dispatchHelpCommand(subcommandName) {
    if (!subcommandName) {
      this.help();
    }
    const subCommand = this._findCommand(subcommandName);
    if (subCommand && !subCommand._executableHandler) {
      subCommand.help();
    }
    return this._dispatchSubcommand(
      subcommandName,
      [],
      [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
    );
  }
  /**
   * Check this.args against expected this.registeredArguments.
   *
   * @private
   */
  _checkNumberOfArguments() {
    this.registeredArguments.forEach((arg, i) => {
      if (arg.required && this.args[i] == null) {
        this.missingArgument(arg.name());
      }
    });
    if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
      return;
    }
    if (this.args.length > this.registeredArguments.length) {
      this._excessArguments(this.args);
    }
  }
  /**
   * Process this.args using this.registeredArguments and save as this.processedArgs!
   *
   * @private
   */
  _processArguments() {
    const myParseArg = (argument, value, previous) => {
      let parsedValue = value;
      if (value !== null && argument.parseArg) {
        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
        parsedValue = this._callParseArg(
          argument,
          value,
          previous,
          invalidValueMessage
        );
      }
      return parsedValue;
    };
    this._checkNumberOfArguments();
    const processedArgs = [];
    this.registeredArguments.forEach((declaredArg, index) => {
      let value = declaredArg.defaultValue;
      if (declaredArg.variadic) {
        if (index < this.args.length) {
          value = this.args.slice(index);
          if (declaredArg.parseArg) {
            value = value.reduce((processed, v) => {
              return myParseArg(declaredArg, v, processed);
            }, declaredArg.defaultValue);
          }
        } else if (value === void 0) {
          value = [];
        }
      } else if (index < this.args.length) {
        value = this.args[index];
        if (declaredArg.parseArg) {
          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
        }
      }
      processedArgs[index] = value;
    });
    this.processedArgs = processedArgs;
  }
  /**
   * Once we have a promise we chain, but call synchronously until then.
   *
   * @param {(Promise|undefined)} promise
   * @param {Function} fn
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCall(promise, fn2) {
    if (promise?.then && typeof promise.then === "function") {
      return promise.then(() => fn2());
    }
    return fn2();
  }
  /**
   *
   * @param {(Promise|undefined)} promise
   * @param {string} event
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCallHooks(promise, event) {
    let result = promise;
    const hooks = [];
    this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
      hookedCommand._lifeCycleHooks[event].forEach((callback) => {
        hooks.push({ hookedCommand, callback });
      });
    });
    if (event === "postAction") {
      hooks.reverse();
    }
    hooks.forEach((hookDetail) => {
      result = this._chainOrCall(result, () => {
        return hookDetail.callback(hookDetail.hookedCommand, this);
      });
    });
    return result;
  }
  /**
   *
   * @param {(Promise|undefined)} promise
   * @param {Command} subCommand
   * @param {string} event
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCallSubCommandHook(promise, subCommand, event) {
    let result = promise;
    if (this._lifeCycleHooks[event] !== void 0) {
      this._lifeCycleHooks[event].forEach((hook) => {
        result = this._chainOrCall(result, () => {
          return hook(this, subCommand);
        });
      });
    }
    return result;
  }
  /**
   * Process arguments in context of this command.
   * Returns action result, in case it is a promise.
   *
   * @private
   */
  _parseCommand(operands, unknown) {
    const parsed = this.parseOptions(unknown);
    this._parseOptionsEnv();
    this._parseOptionsImplied();
    operands = operands.concat(parsed.operands);
    unknown = parsed.unknown;
    this.args = operands.concat(unknown);
    if (operands && this._findCommand(operands[0])) {
      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
    }
    if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
      return this._dispatchHelpCommand(operands[1]);
    }
    if (this._defaultCommandName) {
      this._outputHelpIfRequested(unknown);
      return this._dispatchSubcommand(
        this._defaultCommandName,
        operands,
        unknown
      );
    }
    if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
      this.help({ error: true });
    }
    this._outputHelpIfRequested(parsed.unknown);
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();
    const checkForUnknownOptions = () => {
      if (parsed.unknown.length > 0) {
        this.unknownOption(parsed.unknown[0]);
      }
    };
    const commandEvent = `command:${this.name()}`;
    if (this._actionHandler) {
      checkForUnknownOptions();
      this._processArguments();
      let promiseChain;
      promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
      promiseChain = this._chainOrCall(
        promiseChain,
        () => this._actionHandler(this.processedArgs)
      );
      if (this.parent) {
        promiseChain = this._chainOrCall(promiseChain, () => {
          this.parent.emit(commandEvent, operands, unknown);
        });
      }
      promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
      return promiseChain;
    }
    if (this.parent?.listenerCount(commandEvent)) {
      checkForUnknownOptions();
      this._processArguments();
      this.parent.emit(commandEvent, operands, unknown);
    } else if (operands.length) {
      if (this._findCommand("*")) {
        return this._dispatchSubcommand("*", operands, unknown);
      }
      if (this.listenerCount("command:*")) {
        this.emit("command:*", operands, unknown);
      } else if (this.commands.length) {
        this.unknownCommand();
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    } else if (this.commands.length) {
      checkForUnknownOptions();
      this.help({ error: true });
    } else {
      checkForUnknownOptions();
      this._processArguments();
    }
  }
  /**
   * Find matching command.
   *
   * @private
   * @return {Command | undefined}
   */
  _findCommand(name) {
    if (!name) return void 0;
    return this.commands.find(
      (cmd) => cmd._name === name || cmd._aliases.includes(name)
    );
  }
  /**
   * Return an option matching `arg` if any.
   *
   * @param {string} arg
   * @return {Option}
   * @package
   */
  _findOption(arg) {
    return this.options.find((option) => option.is(arg));
  }
  /**
   * Display an error message if a mandatory option does not have a value.
   * Called after checking for help flags in leaf subcommand.
   *
   * @private
   */
  _checkForMissingMandatoryOptions() {
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd.options.forEach((anOption) => {
        if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
          cmd.missingMandatoryOptionValue(anOption);
        }
      });
    });
  }
  /**
   * Display an error message if conflicting options are used together in this.
   *
   * @private
   */
  _checkForConflictingLocalOptions() {
    const definedNonDefaultOptions = this.options.filter((option) => {
      const optionKey = option.attributeName();
      if (this.getOptionValue(optionKey) === void 0) {
        return false;
      }
      return this.getOptionValueSource(optionKey) !== "default";
    });
    const optionsWithConflicting = definedNonDefaultOptions.filter(
      (option) => option.conflictsWith.length > 0
    );
    optionsWithConflicting.forEach((option) => {
      const conflictingAndDefined = definedNonDefaultOptions.find(
        (defined) => option.conflictsWith.includes(defined.attributeName())
      );
      if (conflictingAndDefined) {
        this._conflictingOption(option, conflictingAndDefined);
      }
    });
  }
  /**
   * Display an error message if conflicting options are used together.
   * Called after checking for help flags in leaf subcommand.
   *
   * @private
   */
  _checkForConflictingOptions() {
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd._checkForConflictingLocalOptions();
    });
  }
  /**
   * Parse options from `argv` removing known options,
   * and return argv split into operands and unknown arguments.
   *
   * Side effects: modifies command by storing options. Does not reset state if called again.
   *
   * Examples:
   *
   *     argv => operands, unknown
   *     --known kkk op => [op], []
   *     op --known kkk => [op], []
   *     sub --unknown uuu op => [sub], [--unknown uuu op]
   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
   *
   * @param {string[]} args
   * @return {{operands: string[], unknown: string[]}}
   */
  parseOptions(args) {
    const operands = [];
    const unknown = [];
    let dest = operands;
    function maybeOption(arg) {
      return arg.length > 1 && arg[0] === "-";
    }
    const negativeNumberArg = (arg) => {
      if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
      return !this._getCommandAndAncestors().some(
        (cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short))
      );
    };
    let activeVariadicOption = null;
    let activeGroup = null;
    let i = 0;
    while (i < args.length || activeGroup) {
      const arg = activeGroup ?? args[i++];
      activeGroup = null;
      if (arg === "--") {
        if (dest === unknown) dest.push(arg);
        dest.push(...args.slice(i));
        break;
      }
      if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
        this.emit(`option:${activeVariadicOption.name()}`, arg);
        continue;
      }
      activeVariadicOption = null;
      if (maybeOption(arg)) {
        const option = this._findOption(arg);
        if (option) {
          if (option.required) {
            const value = args[i++];
            if (value === void 0) this.optionMissingArgument(option);
            this.emit(`option:${option.name()}`, value);
          } else if (option.optional) {
            let value = null;
            if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
              value = args[i++];
            }
            this.emit(`option:${option.name()}`, value);
          } else {
            this.emit(`option:${option.name()}`);
          }
          activeVariadicOption = option.variadic ? option : null;
          continue;
        }
      }
      if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
        const option = this._findOption(`-${arg[1]}`);
        if (option) {
          if (option.required || option.optional && this._combineFlagAndOptionalValue) {
            this.emit(`option:${option.name()}`, arg.slice(2));
          } else {
            this.emit(`option:${option.name()}`);
            activeGroup = `-${arg.slice(2)}`;
          }
          continue;
        }
      }
      if (/^--[^=]+=/.test(arg)) {
        const index = arg.indexOf("=");
        const option = this._findOption(arg.slice(0, index));
        if (option && (option.required || option.optional)) {
          this.emit(`option:${option.name()}`, arg.slice(index + 1));
          continue;
        }
      }
      if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
        dest = unknown;
      }
      if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
        if (this._findCommand(arg)) {
          operands.push(arg);
          unknown.push(...args.slice(i));
          break;
        } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
          operands.push(arg, ...args.slice(i));
          break;
        } else if (this._defaultCommandName) {
          unknown.push(arg, ...args.slice(i));
          break;
        }
      }
      if (this._passThroughOptions) {
        dest.push(arg, ...args.slice(i));
        break;
      }
      dest.push(arg);
    }
    return { operands, unknown };
  }
  /**
   * Return an object containing local option values as key-value pairs.
   *
   * @return {object}
   */
  opts() {
    if (this._storeOptionsAsProperties) {
      const result = {};
      const len = this.options.length;
      for (let i = 0; i < len; i++) {
        const key = this.options[i].attributeName();
        result[key] = key === this._versionOptionName ? this._version : this[key];
      }
      return result;
    }
    return this._optionValues;
  }
  /**
   * Return an object containing merged local and global option values as key-value pairs.
   *
   * @return {object}
   */
  optsWithGlobals() {
    return this._getCommandAndAncestors().reduce(
      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
      {}
    );
  }
  /**
   * Display error message and exit (or call exitOverride).
   *
   * @param {string} message
   * @param {object} [errorOptions]
   * @param {string} [errorOptions.code] - an id string representing the error
   * @param {number} [errorOptions.exitCode] - used with process.exit
   */
  error(message, errorOptions) {
    this._outputConfiguration.outputError(
      `${message}
`,
      this._outputConfiguration.writeErr
    );
    if (typeof this._showHelpAfterError === "string") {
      this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
    } else if (this._showHelpAfterError) {
      this._outputConfiguration.writeErr("\n");
      this.outputHelp({ error: true });
    }
    const config = errorOptions || {};
    const exitCode = config.exitCode || 1;
    const code = config.code || "commander.error";
    this._exit(exitCode, code, message);
  }
  /**
   * Apply any option related environment variables, if option does
   * not have a value from cli or client code.
   *
   * @private
   */
  _parseOptionsEnv() {
    this.options.forEach((option) => {
      if (option.envVar && option.envVar in process2.env) {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
          this.getOptionValueSource(optionKey)
        )) {
          if (option.required || option.optional) {
            this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
          } else {
            this.emit(`optionEnv:${option.name()}`);
          }
        }
      }
    });
  }
  /**
   * Apply any implied option values, if option is undefined or default value.
   *
   * @private
   */
  _parseOptionsImplied() {
    const dualHelper = new DualOptions(this.options);
    const hasCustomOptionValue = (optionKey) => {
      return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
    };
    this.options.filter(
      (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
        this.getOptionValue(option.attributeName()),
        option
      )
    ).forEach((option) => {
      Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
        this.setOptionValueWithSource(
          impliedKey,
          option.implied[impliedKey],
          "implied"
        );
      });
    });
  }
  /**
   * Argument `name` is missing.
   *
   * @param {string} name
   * @private
   */
  missingArgument(name) {
    const message = `error: missing required argument '${name}'`;
    this.error(message, { code: "commander.missingArgument" });
  }
  /**
   * `Option` is missing an argument.
   *
   * @param {Option} option
   * @private
   */
  optionMissingArgument(option) {
    const message = `error: option '${option.flags}' argument missing`;
    this.error(message, { code: "commander.optionMissingArgument" });
  }
  /**
   * `Option` does not have a value, and is a mandatory option.
   *
   * @param {Option} option
   * @private
   */
  missingMandatoryOptionValue(option) {
    const message = `error: required option '${option.flags}' not specified`;
    this.error(message, { code: "commander.missingMandatoryOptionValue" });
  }
  /**
   * `Option` conflicts with another option.
   *
   * @param {Option} option
   * @param {Option} conflictingOption
   * @private
   */
  _conflictingOption(option, conflictingOption) {
    const findBestOptionFromValue = (option2) => {
      const optionKey = option2.attributeName();
      const optionValue = this.getOptionValue(optionKey);
      const negativeOption = this.options.find(
        (target) => target.negate && optionKey === target.attributeName()
      );
      const positiveOption = this.options.find(
        (target) => !target.negate && optionKey === target.attributeName()
      );
      if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
        return negativeOption;
      }
      return positiveOption || option2;
    };
    const getErrorMessage = (option2) => {
      const bestOption = findBestOptionFromValue(option2);
      const optionKey = bestOption.attributeName();
      const source = this.getOptionValueSource(optionKey);
      if (source === "env") {
        return `environment variable '${bestOption.envVar}'`;
      }
      return `option '${bestOption.flags}'`;
    };
    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
    this.error(message, { code: "commander.conflictingOption" });
  }
  /**
   * Unknown option `flag`.
   *
   * @param {string} flag
   * @private
   */
  unknownOption(flag) {
    if (this._allowUnknownOption) return;
    let suggestion = "";
    if (flag.startsWith("--") && this._showSuggestionAfterError) {
      let candidateFlags = [];
      let command = this;
      do {
        const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
        candidateFlags = candidateFlags.concat(moreFlags);
        command = command.parent;
      } while (command && !command._enablePositionalOptions);
      suggestion = suggestSimilar(flag, candidateFlags);
    }
    const message = `error: unknown option '${flag}'${suggestion}`;
    this.error(message, { code: "commander.unknownOption" });
  }
  /**
   * Excess arguments, more than expected.
   *
   * @param {string[]} receivedArgs
   * @private
   */
  _excessArguments(receivedArgs) {
    if (this._allowExcessArguments) return;
    const expected = this.registeredArguments.length;
    const s = expected === 1 ? "" : "s";
    const received = receivedArgs.length;
    const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
    const details = receivedArgs.join(", ");
    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${received}: ${details}.`;
    this.error(message, { code: "commander.excessArguments" });
  }
  /**
   * Unknown command.
   *
   * @private
   */
  unknownCommand() {
    const unknownName = this.args[0];
    let suggestion = "";
    if (this._showSuggestionAfterError) {
      const candidateNames = [];
      this.createHelp().visibleCommands(this).forEach((command) => {
        candidateNames.push(command.name());
        if (command.alias()) candidateNames.push(command.alias());
      });
      suggestion = suggestSimilar(unknownName, candidateNames);
    }
    const message = `error: unknown command '${unknownName}'${suggestion}`;
    this.error(message, { code: "commander.unknownCommand" });
  }
  /**
   * Get or set the program version.
   *
   * This method auto-registers the "-V, --version" option which will print the version number.
   *
   * You can optionally supply the flags and description to override the defaults.
   *
   * @param {string} [str]
   * @param {string} [flags]
   * @param {string} [description]
   * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
   */
  version(str, flags, description) {
    if (str === void 0) return this._version;
    this._version = str;
    flags = flags || "-V, --version";
    description = description || "output the version number";
    const versionOption = this.createOption(flags, description);
    this._versionOptionName = versionOption.attributeName();
    this._registerOption(versionOption);
    this.on("option:" + versionOption.name(), () => {
      this._outputConfiguration.writeOut(`${str}
`);
      this._exit(0, "commander.version", str);
    });
    return this;
  }
  /**
   * Set the description.
   *
   * @param {string} [str]
   * @param {object} [argsDescription]
   * @return {(string|Command)}
   */
  description(str, argsDescription) {
    if (str === void 0 && argsDescription === void 0)
      return this._description;
    this._description = str;
    if (argsDescription) {
      this._argsDescription = argsDescription;
    }
    return this;
  }
  /**
   * Set the summary. Used when listed as subcommand of parent.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  summary(str) {
    if (str === void 0) return this._summary;
    this._summary = str;
    return this;
  }
  /**
   * Set an alias for the command.
   *
   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
   *
   * @param {string} [alias]
   * @return {(string|Command)}
   */
  alias(alias) {
    if (alias === void 0) return this._aliases[0];
    let command = this;
    if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
      command = this.commands[this.commands.length - 1];
    }
    if (alias === command._name)
      throw new Error("Command alias can't be the same as its name");
    const matchingCommand = this.parent?._findCommand(alias);
    if (matchingCommand) {
      const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
      throw new Error(
        `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
      );
    }
    command._aliases.push(alias);
    return this;
  }
  /**
   * Set aliases for the command.
   *
   * Only the first alias is shown in the auto-generated help.
   *
   * @param {string[]} [aliases]
   * @return {(string[]|Command)}
   */
  aliases(aliases) {
    if (aliases === void 0) return this._aliases;
    aliases.forEach((alias) => this.alias(alias));
    return this;
  }
  /**
   * Set / get the command usage `str`.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  usage(str) {
    if (str === void 0) {
      if (this._usage) return this._usage;
      const args = this.registeredArguments.map((arg) => {
        return humanReadableArgName(arg);
      });
      return [].concat(
        this.options.length || this._helpOption !== null ? "[options]" : [],
        this.commands.length ? "[command]" : [],
        this.registeredArguments.length ? args : []
      ).join(" ");
    }
    this._usage = str;
    return this;
  }
  /**
   * Get or set the name of the command.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  name(str) {
    if (str === void 0) return this._name;
    this._name = str;
    return this;
  }
  /**
   * Set/get the help group heading for this subcommand in parent command's help.
   *
   * @param {string} [heading]
   * @return {Command | string}
   */
  helpGroup(heading) {
    if (heading === void 0) return this._helpGroupHeading ?? "";
    this._helpGroupHeading = heading;
    return this;
  }
  /**
   * Set/get the default help group heading for subcommands added to this command.
   * (This does not override a group set directly on the subcommand using .helpGroup().)
   *
   * @example
   * program.commandsGroup('Development Commands:);
   * program.command('watch')...
   * program.command('lint')...
   * ...
   *
   * @param {string} [heading]
   * @returns {Command | string}
   */
  commandsGroup(heading) {
    if (heading === void 0) return this._defaultCommandGroup ?? "";
    this._defaultCommandGroup = heading;
    return this;
  }
  /**
   * Set/get the default help group heading for options added to this command.
   * (This does not override a group set directly on the option using .helpGroup().)
   *
   * @example
   * program
   *   .optionsGroup('Development Options:')
   *   .option('-d, --debug', 'output extra debugging')
   *   .option('-p, --profile', 'output profiling information')
   *
   * @param {string} [heading]
   * @returns {Command | string}
   */
  optionsGroup(heading) {
    if (heading === void 0) return this._defaultOptionGroup ?? "";
    this._defaultOptionGroup = heading;
    return this;
  }
  /**
   * @param {Option} option
   * @private
   */
  _initOptionGroup(option) {
    if (this._defaultOptionGroup && !option.helpGroupHeading)
      option.helpGroup(this._defaultOptionGroup);
  }
  /**
   * @param {Command} cmd
   * @private
   */
  _initCommandGroup(cmd) {
    if (this._defaultCommandGroup && !cmd.helpGroup())
      cmd.helpGroup(this._defaultCommandGroup);
  }
  /**
   * Set the name of the command from script filename, such as process.argv[1],
   * or import.meta.filename.
   *
   * (Used internally and public although not documented in README.)
   *
   * @example
   * program.nameFromFilename(import.meta.filename);
   *
   * @param {string} filename
   * @return {Command}
   */
  nameFromFilename(filename) {
    this._name = path.basename(filename, path.extname(filename));
    return this;
  }
  /**
   * Get or set the directory for searching for executable subcommands of this command.
   *
   * @example
   * program.executableDir(import.meta.dirname);
   * // or
   * program.executableDir('subcommands');
   *
   * @param {string} [path]
   * @return {(string|null|Command)}
   */
  executableDir(path8) {
    if (path8 === void 0) return this._executableDir;
    this._executableDir = path8;
    return this;
  }
  /**
   * Return program help documentation.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
   * @return {string}
   */
  helpInformation(contextOptions) {
    const helper = this.createHelp();
    const context = this._getOutputContext(contextOptions);
    helper.prepareContext({
      error: context.error,
      helpWidth: context.helpWidth,
      outputHasColors: context.hasColors
    });
    const text6 = helper.formatHelp(this, helper);
    if (context.hasColors) return text6;
    return this._outputConfiguration.stripColor(text6);
  }
  /**
   * @typedef HelpContext
   * @type {object}
   * @property {boolean} error
   * @property {number} helpWidth
   * @property {boolean} hasColors
   * @property {function} write - includes stripColor if needed
   *
   * @returns {HelpContext}
   * @private
   */
  _getOutputContext(contextOptions) {
    contextOptions = contextOptions || {};
    const error = !!contextOptions.error;
    let baseWrite;
    let hasColors;
    let helpWidth;
    if (error) {
      baseWrite = (str) => this._outputConfiguration.writeErr(str);
      hasColors = this._outputConfiguration.getErrHasColors();
      helpWidth = this._outputConfiguration.getErrHelpWidth();
    } else {
      baseWrite = (str) => this._outputConfiguration.writeOut(str);
      hasColors = this._outputConfiguration.getOutHasColors();
      helpWidth = this._outputConfiguration.getOutHelpWidth();
    }
    const write = (str) => {
      if (!hasColors) str = this._outputConfiguration.stripColor(str);
      return baseWrite(str);
    };
    return { error, write, hasColors, helpWidth };
  }
  /**
   * Output help information for this command.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */
  outputHelp(contextOptions) {
    let deprecatedCallback;
    if (typeof contextOptions === "function") {
      deprecatedCallback = contextOptions;
      contextOptions = void 0;
    }
    const outputContext = this._getOutputContext(contextOptions);
    const eventContext = {
      error: outputContext.error,
      write: outputContext.write,
      command: this
    };
    this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
    this.emit("beforeHelp", eventContext);
    let helpInformation = this.helpInformation({ error: outputContext.error });
    if (deprecatedCallback) {
      helpInformation = deprecatedCallback(helpInformation);
      if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
        throw new Error("outputHelp callback must return a string or a Buffer");
      }
    }
    outputContext.write(helpInformation);
    if (this._getHelpOption()?.long) {
      this.emit(this._getHelpOption().long);
    }
    this.emit("afterHelp", eventContext);
    this._getCommandAndAncestors().forEach(
      (command) => command.emit("afterAllHelp", eventContext)
    );
  }
  /**
   * You can pass in flags and a description to customise the built-in help option.
   * Pass in false to disable the built-in help option.
   *
   * @example
   * program.helpOption('-?, --help' 'show help'); // customise
   * program.helpOption(false); // disable
   *
   * @param {(string | boolean)} flags
   * @param {string} [description]
   * @return {Command} `this` command for chaining
   */
  helpOption(flags, description) {
    if (typeof flags === "boolean") {
      if (flags) {
        if (this._helpOption === null) this._helpOption = void 0;
        if (this._defaultOptionGroup) {
          this._initOptionGroup(this._getHelpOption());
        }
      } else {
        this._helpOption = null;
      }
      return this;
    }
    this._helpOption = this.createOption(
      flags ?? "-h, --help",
      description ?? "display help for command"
    );
    if (flags || description) this._initOptionGroup(this._helpOption);
    return this;
  }
  /**
   * Lazy create help option.
   * Returns null if has been disabled with .helpOption(false).
   *
   * @returns {(Option | null)} the help option
   * @package
   */
  _getHelpOption() {
    if (this._helpOption === void 0) {
      this.helpOption(void 0, void 0);
    }
    return this._helpOption;
  }
  /**
   * Supply your own option to use for the built-in help option.
   * This is an alternative to using helpOption() to customise the flags and description etc.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addHelpOption(option) {
    this._helpOption = option;
    this._initOptionGroup(option);
    return this;
  }
  /**
   * Output help information and exit.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */
  help(contextOptions) {
    this.outputHelp(contextOptions);
    let exitCode = Number(process2.exitCode ?? 0);
    if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
      exitCode = 1;
    }
    this._exit(exitCode, "commander.help", "(outputHelp)");
  }
  /**
   * // Do a little typing to coordinate emit and listener for the help text events.
   * @typedef HelpTextEventContext
   * @type {object}
   * @property {boolean} error
   * @property {Command} command
   * @property {function} write
   */
  /**
   * Add additional text to be displayed with the built-in help.
   *
   * Position is 'before' or 'after' to affect just this command,
   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
   *
   * @param {string} position - before or after built-in help
   * @param {(string | Function)} text - string to add, or a function returning a string
   * @return {Command} `this` command for chaining
   */
  addHelpText(position, text6) {
    const allowedValues = ["beforeAll", "before", "after", "afterAll"];
    if (!allowedValues.includes(position)) {
      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    const helpEvent = `${position}Help`;
    this.on(helpEvent, (context) => {
      let helpStr;
      if (typeof text6 === "function") {
        helpStr = text6({ error: context.error, command: context.command });
      } else {
        helpStr = text6;
      }
      if (helpStr) {
        context.write(`${helpStr}
`);
      }
    });
    return this;
  }
  /**
   * Output help information if help flags specified
   *
   * @param {Array} args - array of options to search for help flags
   * @private
   */
  _outputHelpIfRequested(args) {
    const helpOption = this._getHelpOption();
    const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
    if (helpRequested) {
      this.outputHelp();
      this._exit(0, "commander.helpDisplayed", "(outputHelp)");
    }
  }
};
function incrementNodeInspectorPort(args) {
  return args.map((arg) => {
    if (!arg.startsWith("--inspect")) {
      return arg;
    }
    let debugOption;
    let debugHost = "127.0.0.1";
    let debugPort = "9229";
    let match;
    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
      debugOption = match[1];
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
      debugOption = match[1];
      if (/^\d+$/.test(match[3])) {
        debugPort = match[3];
      } else {
        debugHost = match[3];
      }
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
      debugOption = match[1];
      debugHost = match[3];
      debugPort = match[4];
    }
    if (debugOption && debugPort !== "0") {
      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
    }
    return arg;
  });
}
function useColor() {
  if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
    return false;
  if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
    return true;
  return void 0;
}

// ../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/index.js
var program = new Command();

// ../../packages/storage/src/file-store.ts
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
import { randomUUID } from "node:crypto";

// ../../packages/storage/src/types.ts
function defineStorageKey(name, codec) {
  if (name.length === 0) {
    throw new Error("Storage key names cannot be empty");
  }
  if (!Number.isSafeInteger(codec.version) || codec.version < 1) {
    throw new Error("Storage codec versions must be positive safe integers");
  }
  return Object.freeze({ name, codec });
}
function isJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === "object") {
    return Object.values(value).every(isJsonValue);
  }
  return false;
}
function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ../../packages/storage/src/file-store.ts
var FORMAT_VERSION = 1;
var RECORDS_DIRECTORY = "records";
function createFileKeyValueStore(options) {
  const recordsDir = path2.join(options.rootDir, RECORDS_DIRECTORY);
  return {
    get: (key) => readValue(recordsDir, key),
    set: (key, value) => writeValue(recordsDir, key, value),
    delete: (key) => deleteValue(recordsDir, key),
    has: (key) => hasValue(recordsDir, key),
    keys: () => listKeys(recordsDir),
    clear: () => clearStore(recordsDir),
    records: () => listRecords(recordsDir),
    claim: (key, value) => claimValue(recordsDir, key, value)
  };
}
async function readValue(recordsDir, key) {
  let raw;
  try {
    raw = await fs2.readFile(recordPath(recordsDir, key), "utf8");
  } catch (error) {
    if (isFileNotFound(error)) {
      return void 0;
    }
    throw error;
  }
  const envelope = parseEnvelope(raw);
  if (envelope === void 0 || envelope.schemaVersion > key.codec.version) {
    return void 0;
  }
  let value = envelope.value;
  let schemaVersion = envelope.schemaVersion;
  while (schemaVersion < key.codec.version) {
    const migrate = key.codec.migrations?.[schemaVersion];
    if (migrate === void 0) {
      return void 0;
    }
    try {
      value = migrate(value);
    } catch {
      return void 0;
    }
    if (!isJsonValue(value)) {
      return void 0;
    }
    schemaVersion += 1;
  }
  const decoded = key.codec.decode(value);
  if (decoded === void 0) {
    return void 0;
  }
  if (schemaVersion !== envelope.schemaVersion) {
    await writeEnvelope(recordsDir, key, key.codec.encode(decoded));
  }
  return decoded;
}
async function writeValue(recordsDir, key, value) {
  const encoded = key.codec.encode(value);
  if (!isJsonValue(encoded)) {
    throw new Error(`Storage codec for "${key.name}" returned a non-JSON value`);
  }
  if (key.codec.decode(encoded) === void 0) {
    throw new Error(
      `Value for "${key.name}" does not satisfy its own storage codec, so nothing was written: reading it back would return undefined, indistinguishable from a key that was never set`
    );
  }
  await writeEnvelope(recordsDir, key, encoded);
}
async function claimValue(recordsDir, key, value) {
  const encoded = key.codec.encode(value);
  if (!isJsonValue(encoded)) {
    throw new Error(`Storage codec for "${key.name}" returned a non-JSON value`);
  }
  if (key.codec.decode(encoded) === void 0) {
    throw new Error(
      `Value for "${key.name}" does not satisfy its own storage codec, so nothing was claimed`
    );
  }
  await fs2.mkdir(recordsDir, { recursive: true, mode: 448 });
  const envelope = {
    formatVersion: FORMAT_VERSION,
    schemaVersion: key.codec.version,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    value: encoded
  };
  try {
    await fs2.writeFile(recordPath(recordsDir, key), `${JSON.stringify(envelope)}
`, {
      encoding: "utf8",
      mode: 384,
      flag: "wx"
    });
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") {
      return false;
    }
    throw error;
  }
}
async function writeEnvelope(recordsDir, key, value) {
  await fs2.mkdir(recordsDir, { recursive: true, mode: 448 });
  const envelope = {
    formatVersion: FORMAT_VERSION,
    schemaVersion: key.codec.version,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    value
  };
  const targetPath = recordPath(recordsDir, key);
  const temporaryPath = path2.join(recordsDir, `.${path2.basename(targetPath)}.${randomUUID()}.tmp`);
  try {
    await fs2.writeFile(temporaryPath, `${JSON.stringify(envelope)}
`, {
      encoding: "utf8",
      mode: 384
    });
    await fs2.rename(temporaryPath, targetPath);
  } finally {
    await fs2.rm(temporaryPath, { force: true });
  }
}
async function deleteValue(recordsDir, key) {
  try {
    await fs2.unlink(recordPath(recordsDir, key));
    return true;
  } catch (error) {
    if (isFileNotFound(error)) {
      return false;
    }
    throw error;
  }
}
async function hasValue(recordsDir, key) {
  return await readValue(recordsDir, key) !== void 0;
}
async function readRecordDirEntries(recordsDir) {
  try {
    return await fs2.readdir(recordsDir, { withFileTypes: true });
  } catch (error) {
    if (isFileNotFound(error)) {
      return [];
    }
    throw error;
  }
}
function decodeRecordKey(fileName) {
  try {
    return decodeURIComponent(fileName.slice(0, -".json".length));
  } catch {
    return void 0;
  }
}
async function listKeys(recordsDir) {
  const entries = await readRecordDirEntries(recordsDir);
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).flatMap((entry) => {
    const key = decodeRecordKey(entry.name);
    return key === void 0 ? [] : [key];
  }).sort();
}
async function clearStore(recordsDir) {
  const entries = await readRecordDirEntries(recordsDir);
  await Promise.all(
    entries.filter(
      (entry) => entry.isFile() && (entry.name.endsWith(".json") || entry.name.endsWith(".tmp"))
    ).map((entry) => fs2.unlink(path2.join(recordsDir, entry.name)))
  );
}
async function listRecords(recordsDir) {
  const entries = await readRecordDirEntries(recordsDir);
  const records = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const key = decodeRecordKey(entry.name);
    if (key === void 0) {
      continue;
    }
    let raw;
    try {
      raw = await fs2.readFile(path2.join(recordsDir, entry.name), "utf8");
    } catch (error) {
      if (isFileNotFound(error)) {
        continue;
      }
      throw error;
    }
    const envelope = parseEnvelope(raw);
    if (envelope === void 0) {
      continue;
    }
    records.push({ key, ...envelope });
  }
  return records.sort((a, b) => a.key.localeCompare(b.key));
}
function recordPath(recordsDir, key) {
  return path2.join(recordsDir, `${encodeURIComponent(key.name)}.json`);
}
function parseEnvelope(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!isJsonValue(parsed) || !isJsonObject(parsed)) {
    return void 0;
  }
  const formatVersion = parsed.formatVersion;
  const schemaVersion = parsed.schemaVersion;
  const updatedAt = parsed.updatedAt;
  const value = parsed.value;
  if (formatVersion !== FORMAT_VERSION || typeof schemaVersion !== "number" || !Number.isSafeInteger(schemaVersion) || schemaVersion < 1 || typeof updatedAt !== "string" || !isJsonValue(value)) {
    return void 0;
  }
  return { formatVersion, schemaVersion, updatedAt, value };
}
function isFileNotFound(error) {
  return isNodeError(error) && error.code === "ENOENT";
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

// ../../packages/storage/src/claude.ts
import os from "node:os";
import path3 from "node:path";
var NO_SESSION_ID_MESSAGE = "No session id resolved: set CLAUDE_CODE_SESSION_ID or CODEX_SESSION_ID in the environment, or pass --session-id explicitly, to scope storage to a session.";
var NO_PLUGIN_DATA_MESSAGE = "No plugin data directory resolved: set CLAUDE_PLUGIN_DATA in the environment, or pass a plugin data directory explicitly.";
var SESSIONS_DIRECTORY_NAME = "sessions";
var MEMORY_DIRECTORY_NAME = "memory";
function createClaudeStores(options) {
  const sessionId = nonEmpty(options.sessionId);
  if (sessionId !== void 0) requireSafeSessionId(sessionId);
  const env = options.env ?? process.env;
  const configDirectory = options.configDirectory ?? env.CLAUDE_CONFIG_DIR ?? path3.join(options.homeDirectory ?? os.homedir(), ".claude");
  const resolvedPluginData = nonEmpty(options.pluginDataDirectory) ?? nonEmpty(env.CLAUDE_PLUGIN_DATA);
  if (resolvedPluginData === void 0 && options.pluginDataFallback === "reject") {
    const unresolved = createUnresolvedStore(options.noPluginDataMessage ?? NO_PLUGIN_DATA_MESSAGE);
    return { session: unresolved, plugin: unresolved, paths: { configDirectory } };
  }
  const pluginDataDirectory = resolvedPluginData ?? path3.join(configDirectory, "plugins", "data", normalizePluginId(options.pluginId));
  const memoryDirectory = path3.join(pluginDataDirectory, MEMORY_DIRECTORY_NAME);
  const sessionsRootDirectory = path3.join(pluginDataDirectory, SESSIONS_DIRECTORY_NAME);
  const sessionDirectory = sessionId === void 0 ? void 0 : path3.join(sessionsRootDirectory, encodeURIComponent(sessionId), MEMORY_DIRECTORY_NAME);
  return {
    session: sessionDirectory === void 0 ? createUnresolvedStore(NO_SESSION_ID_MESSAGE) : createFileKeyValueStore({ rootDir: sessionDirectory }),
    plugin: createFileKeyValueStore({ rootDir: memoryDirectory }),
    paths: { configDirectory, sessionDirectory, sessionsRootDirectory, pluginDataDirectory }
  };
}
function nonEmpty(value) {
  return value !== void 0 && value.length > 0 ? value : void 0;
}
function createUnresolvedStore(message) {
  const reject = () => Promise.reject(new Error(message));
  return {
    get: reject,
    set: reject,
    delete: reject,
    has: reject,
    keys: reject,
    clear: reject,
    records: reject,
    claim: reject
  };
}
function requireSafeSessionId(sessionId) {
  if (sessionId === "." || sessionId === "..") {
    throw new Error(
      `sessionId must not be a path-traversal segment ("." or ".."), got ${JSON.stringify(sessionId)}`
    );
  }
  encodeURIComponent(sessionId);
  return sessionId;
}
function normalizePluginId(pluginId) {
  const normalized = requireNonEmpty(pluginId, "pluginId").replace(/[^a-zA-Z0-9_-]/g, "-");
  return requireNonEmpty(normalized, "pluginId");
}
function requireNonEmpty(value, name) {
  if (value.length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  return value;
}

// ../../packages/storage/src/duration.ts
var UNIT_MS = {
  s: 1e3,
  m: 6e4,
  h: 36e5,
  d: 864e5,
  w: 6048e5
};
var DURATION_PATTERN = /^(\d+)([smhdw])$/;
var DURATION_FORMAT_HINT = 'expected a whole number followed by a unit: s (seconds), m (minutes), h (hours), d (days), or w (weeks) \u2014 for example "21d"';
function parseDuration(input) {
  const match = DURATION_PATTERN.exec(input.trim());
  if (match === null) {
    throw new Error(`Invalid duration ${JSON.stringify(input)}: ${DURATION_FORMAT_HINT}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs = UNIT_MS[unit];
  if (amount === 0) {
    throw new Error(
      `Invalid duration ${JSON.stringify(input)}: must be greater than zero, since a zero age expires every session directory but the current one`
    );
  }
  if (!Number.isSafeInteger(amount * unitMs)) {
    throw new Error(`Invalid duration ${JSON.stringify(input)}: too large`);
  }
  return amount * unitMs;
}

// ../../packages/storage/src/session-sweep.ts
import { promises as fs3 } from "node:fs";
import path4 from "node:path";
async function listSessionDirectories(options) {
  const root = options.sessionsRootDirectory;
  const excludedName = options.currentSessionId === void 0 || options.currentSessionId.length === 0 ? void 0 : encodeURIComponent(options.currentSessionId);
  let entries;
  try {
    entries = await fs3.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isFileNotFound2(error)) {
      return [];
    }
    throw error;
  }
  return entries.filter((entry) => entry.isDirectory() && entry.name !== excludedName).map((entry) => ({
    directoryName: entry.name,
    sessionId: decodeSessionId(entry.name),
    path: path4.join(root, entry.name)
  })).sort((a, b) => a.directoryName.localeCompare(b.directoryName));
}
function resolveSessionDirectory(sessionsRootDirectory, directoryName) {
  const root = path4.resolve(sessionsRootDirectory);
  const resolved = path4.resolve(root, directoryName);
  if (resolved === root || path4.dirname(resolved) !== root) {
    throw new Error(
      `Refusing to operate on ${JSON.stringify(directoryName)}: it does not resolve to a direct child of the sessions root ${JSON.stringify(root)}`
    );
  }
  return resolved;
}
async function sweepSessionDirectories(options) {
  const { sessionsRootDirectory, currentSessionId, maxAgeMs, now } = options;
  const dryRun = options.dryRun === true;
  if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) {
    throw new Error(
      `maxAgeMs must be a positive number of milliseconds, got ${String(maxAgeMs)}: a zero or negative age expires every session directory but the current one`
    );
  }
  const removed = [];
  const skipped = [];
  const currentDirectory = await findCurrentSessionDirectory(
    sessionsRootDirectory,
    currentSessionId
  );
  if (currentDirectory !== void 0) {
    skipped.push({
      sessionId: currentDirectory.sessionId,
      path: currentDirectory.path,
      reason: "current-session"
    });
  }
  const candidates = await listSessionDirectories({ sessionsRootDirectory, currentSessionId });
  for (const candidate of candidates) {
    const age = await readDirectoryAge(candidate.path);
    if (age === void 0) {
      continue;
    }
    if (now.getTime() - age.activityMs <= maxAgeMs) {
      skipped.push({
        sessionId: candidate.sessionId,
        path: candidate.path,
        reason: "not-expired",
        ageSource: age.source,
        newestActivityAt: age.newestActivityAt
      });
      continue;
    }
    const target = resolveSessionDirectory(sessionsRootDirectory, candidate.directoryName);
    if (!dryRun) {
      await fs3.rm(target, { recursive: true, force: true });
    }
    removed.push({
      sessionId: candidate.sessionId,
      path: target,
      ageSource: age.source,
      newestActivityAt: age.newestActivityAt
    });
  }
  return {
    sweptAt: now.toISOString(),
    maxAgeMs,
    dryRun,
    examined: removed.length + skipped.length,
    removed,
    skipped
  };
}
function formatSessionSweepReport(report) {
  const verb = report.dryRun ? "Would remove" : "Removed";
  const lines = [
    `${verb} ${report.removed.length} of ${report.examined} session ${report.examined === 1 ? "directory" : "directories"} older than ${report.maxAgeMs}ms, measured at ${report.sweptAt}`
  ];
  for (const removal of report.removed) {
    lines.push(
      `  ${report.dryRun ? "would remove" : "removed"} ${removal.sessionId} (${describeAge(removal.ageSource, removal.newestActivityAt)})`
    );
  }
  for (const skip of report.skipped) {
    const detail = skip.ageSource === void 0 || skip.newestActivityAt === void 0 ? "" : `, ${describeAge(skip.ageSource, skip.newestActivityAt)}`;
    lines.push(`  kept ${skip.sessionId} (${skip.reason}${detail})`);
  }
  return lines.join("\n");
}
function describeAge(source, instant) {
  return source === "updated-at" ? `newest write ${instant}` : `no readable timestamp, directory last touched ${instant}`;
}
async function readDirectoryAge(sessionDirectory) {
  const memoryDirectory = path4.join(sessionDirectory, MEMORY_DIRECTORY_NAME);
  const records = await createFileKeyValueStore({ rootDir: memoryDirectory }).records();
  let newestMs = Number.NEGATIVE_INFINITY;
  let newestUpdatedAt = "";
  for (const record of records) {
    const parsed = Date.parse(record.updatedAt);
    if (!Number.isNaN(parsed) && parsed > newestMs) {
      newestMs = parsed;
      newestUpdatedAt = record.updatedAt;
    }
  }
  if (newestUpdatedAt.length > 0) {
    return { source: "updated-at", activityMs: newestMs, newestActivityAt: newestUpdatedAt };
  }
  const mtimeMs = await newestMtimeMs([
    sessionDirectory,
    memoryDirectory,
    path4.join(memoryDirectory, "records")
  ]);
  if (mtimeMs === void 0) {
    return void 0;
  }
  return {
    source: "directory-mtime",
    activityMs: mtimeMs,
    newestActivityAt: new Date(mtimeMs).toISOString()
  };
}
async function newestMtimeMs(candidates) {
  let newest;
  for (const candidate of candidates) {
    try {
      const { mtimeMs } = await fs3.stat(candidate);
      if (newest === void 0 || mtimeMs > newest) {
        newest = mtimeMs;
      }
    } catch (error) {
      if (isFileNotFound2(error)) {
        continue;
      }
      throw error;
    }
  }
  return newest;
}
async function findCurrentSessionDirectory(sessionsRootDirectory, currentSessionId) {
  if (currentSessionId === void 0 || currentSessionId.length === 0) {
    return void 0;
  }
  const directoryName = encodeURIComponent(currentSessionId);
  const candidate = path4.join(sessionsRootDirectory, directoryName);
  try {
    const stats = await fs3.stat(candidate);
    if (!stats.isDirectory()) {
      return void 0;
    }
  } catch (error) {
    if (isFileNotFound2(error)) {
      return void 0;
    }
    throw error;
  }
  return { directoryName, sessionId: currentSessionId, path: candidate };
}
function decodeSessionId(directoryName) {
  try {
    return decodeURIComponent(directoryName);
  } catch {
    return directoryName;
  }
}
function isFileNotFound2(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// ../../packages/storage/src/commands.ts
var SCOPES = ["session", "plugin"];
function registerStorageCommands(program2, options, observation = {}) {
  const stores = createClaudeStores(options);
  const observeRead = (keys) => {
    try {
      observation.onRead?.(keys);
    } catch {
    }
  };
  program2.command("inspect").description("List a plugin's stored memory keys, or show one key's stored record").requiredOption("-s, --scope <session|plugin>", "memory scope to inspect").option("-k, --key <name>", "inspect one key instead of listing every key").action(async (opts) => {
    const store = resolveScope(stores, opts.scope);
    const records = await store.records();
    if (opts.key !== void 0) {
      const record = records.find((candidate) => candidate.key === opts.key);
      if (record === void 0) {
        console.log(`No record for key "${opts.key}" in scope "${opts.scope}"`);
        return;
      }
      console.log(JSON.stringify(record, null, 2));
      observeRead([record.key]);
      return;
    }
    if (records.length === 0) {
      console.log(`No stored records in scope "${opts.scope}"`);
      return;
    }
    for (const record of records) {
      console.log(
        `${record.key}	schemaVersion=${record.schemaVersion}	updatedAt=${record.updatedAt}`
      );
    }
  });
  program2.command("export").description("Print every stored record in a plugin's memory scope as JSON").requiredOption("-s, --scope <session|plugin>", "memory scope to export").action(async (opts) => {
    const store = resolveScope(stores, opts.scope);
    const records = await store.records();
    console.log(JSON.stringify(records, null, 2));
    observeRead(records.map((record) => record.key));
  });
  program2.command("clear").description("Delete every stored record in a plugin's memory scope").requiredOption("-s, --scope <session|plugin>", "memory scope to clear").option("--yes", "confirm the destructive clear; without it, nothing is deleted").action(async (opts) => {
    const store = resolveScope(stores, opts.scope);
    if (opts.yes !== true) {
      throw new Error(`Refusing to clear scope "${opts.scope}" without --yes`);
    }
    await store.clear();
    console.log(`Cleared scope "${opts.scope}"`);
  });
  program2.command("prune-sessions").description("Remove session memory directories whose newest write is older than a given age").requiredOption(
    "--older-than <duration>",
    "remove a session directory whose newest write is older than this, e.g. 21d"
  ).option("--dry-run", "report what would be removed and remove nothing").option("--yes", "confirm the destructive sweep; without it, nothing is removed").action(async (opts) => {
    const maxAgeMs = parseDuration(opts.olderThan);
    const dryRun = opts.dryRun === true;
    if (!dryRun && opts.yes !== true) {
      throw new Error(
        "Refusing to prune session directories without --yes; pass --dry-run to preview instead"
      );
    }
    const sessionsRootDirectory = stores.paths.sessionsRootDirectory;
    if (sessionsRootDirectory === void 0) {
      throw new Error(options.noPluginDataMessage ?? NO_PLUGIN_DATA_MESSAGE);
    }
    const report = await sweepSessionDirectories({
      sessionsRootDirectory,
      currentSessionId: options.sessionId,
      maxAgeMs,
      now: /* @__PURE__ */ new Date(),
      dryRun
    });
    console.log(formatSessionSweepReport(report));
  });
  return program2;
}
function resolveScope(stores, scope) {
  if (isScope(scope)) {
    return stores[scope];
  }
  throw new Error(`--scope must be one of ${SCOPES.join("|")}, got "${scope}"`);
}
function isScope(value) {
  return SCOPES.includes(value);
}

// ../../packages/verdict/src/index.ts
var USAGE_EXIT = 2;
var UsageError = class extends Error {
  exitCode = USAGE_EXIT;
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
};
var RANK = { pass: 0, warn: 1, fail: 2 };
function worst(statuses) {
  let result = "pass";
  for (const status of statuses) {
    if (RANK[status] > RANK[result]) result = status;
  }
  return result;
}
function build(schema, status, reasons, extra, panels) {
  return { schema, status, reasons: [...reasons], ...extra, panels };
}
function requireReasons(status, reasons) {
  if (reasons.length === 0) {
    throw new Error(
      `A ${status} verdict needs at least one reason: the agent routes on reasons[].code.`
    );
  }
}
function pass(schema, extra = {}, options = {}) {
  return build(schema, "pass", options.reasons ?? [], extra, options.panels ?? "");
}
function warn(schema, reasons, extra = {}, options = {}) {
  requireReasons("warn", reasons);
  return build(schema, "warn", reasons, extra, options.panels ?? "");
}
function fail(schema, reasons, extra = {}, options = {}) {
  requireReasons("fail", reasons);
  return build(schema, "fail", reasons, extra, options.panels ?? "");
}
function withReason(verdict, reason, severity = verdict.status) {
  return {
    ...verdict,
    status: worst([verdict.status, severity]),
    reasons: [...verdict.reasons, reason]
  };
}
function printVerdict(verdict, out = process.stdout) {
  out.write(`${JSON.stringify(verdict, null, 2)}
`);
  lastPrinted = verdict;
}
var lastPrinted;
function takePrintedVerdict() {
  const verdict = lastPrinted;
  lastPrinted = void 0;
  return verdict;
}
function hasPrintedVerdict() {
  return lastPrinted !== void 0;
}

// ../../packages/git-run/src/index.ts
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { accessSync, constants, unlinkSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
function resolveOnPath(command, env = process.env) {
  if (command.includes("/")) return command;
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir === "") continue;
    const candidate = join(dir, command);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
    }
  }
  return command;
}
var GIT = resolveOnPath("git");
function runGit(cwd, args, options = {}, spawn2 = spawnSync) {
  const result = spawn2(GIT, ["-C", cwd, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {}
  });
  if (result.error) {
    const code = result.error.code;
    if (code === "ETIMEDOUT" && options.timeoutMs !== void 0) {
      return {
        ok: false,
        status: null,
        stdout: String(result.stdout ?? ""),
        stderr: `git ${args[0] ?? ""} timed out after ${Math.round(options.timeoutMs / 1e3)}s`,
        timedOut: true
      };
    }
    throw result.error;
  }
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? "")
  };
}
var PROVIDER_DOMAINS = [
  ["bitbucket.org", "bitbucket"],
  ["github.com", "github"]
];
function providerOf(host) {
  for (const [domain, provider] of PROVIDER_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return provider;
  }
  return "unknown";
}
function parseRemote(url) {
  const text6 = url.trim();
  if (!text6) return void 0;
  let host;
  let path8;
  if (text6.includes("://")) {
    try {
      const parsed = new URL(text6);
      host = parsed.hostname;
      path8 = parsed.pathname;
    } catch {
      return void 0;
    }
  } else {
    const scp = /^(?:[^@/]+@)?([^:/]+):(.+)$/.exec(text6);
    if (!scp) return void 0;
    host = scp[1];
    path8 = scp[2];
  }
  const parts = path8.replace(/^\/+/, "").replace(/\.git$/, "").split("/").filter(Boolean);
  if (parts.length < 2) return void 0;
  const lowered = host.trim().toLowerCase();
  return {
    host: lowered,
    workspace: parts[parts.length - 2],
    slug: parts[parts.length - 1],
    provider: providerOf(lowered)
  };
}
function countChanges(porcelain) {
  const lines = porcelain.split("\n").filter((line) => line.trim());
  const staged = lines.filter((line) => line[0] !== " " && line[0] !== "?").length;
  const untracked = lines.filter((line) => line[0] === "?").length;
  const unstaged = lines.filter(
    (line) => line[0] === "?" || line[1] !== void 0 && line[1] !== " "
  ).length;
  return { staged, unstaged, untracked };
}
var RECORD = "";
var FIELD = "";
var LOG_FORMAT = `--format=%H${FIELD}%s${FIELD}%b${RECORD}`;
function parseLog(text6) {
  return text6.split(RECORD).map((record) => record.replace(/^\n+/, "")).filter((record) => record.trim()).map((record) => {
    const [sha, subject = "", body = ""] = record.split(FIELD);
    return { sha: sha.trim(), subject: subject.trim(), body: body.trim() };
  });
}
function parseLfsListing(listing) {
  const lines = listing.split("\n");
  const start = lines.findIndex((line) => /^Listing tracked patterns/i.test(line.trim()));
  if (start === -1) return false;
  for (const line of lines.slice(start + 1)) {
    if (/^Listing /i.test(line.trim())) break;
    if (line.trim()) return true;
  }
  return false;
}
function topLevel(cwd, git = runGit) {
  const result = git(cwd, ["rev-parse", "--show-toplevel"]);
  return result.ok ? result.stdout.trim() : null;
}
function probeWritable(root) {
  const file = join(root, `.git-probe-${process.pid}-${randomBytes(4).toString("hex")}`);
  try {
    writeFileSync(file, "");
    unlinkSync(file);
    return { ok: true };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
function remoteUrl(cwd, remote = "origin", git = runGit) {
  const result = git(cwd, ["remote", "get-url", remote]);
  return result.ok ? result.stdout.trim() : null;
}
function currentBranch(cwd, git = runGit) {
  const result = git(cwd, ["branch", "--show-current"]);
  const branch = result.stdout.trim();
  return result.ok && branch ? branch : null;
}
function defaultBranch(cwd, git = runGit) {
  const head = git(cwd, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  const named = head.ok ? head.stdout.trim().replace(/^origin\//, "") : "";
  if (named) return named;
  return ["main", "master"].find((name) => refExists(cwd, `origin/${name}`, git)) ?? null;
}
function refExists(cwd, ref, git = runGit) {
  return git(cwd, ["rev-parse", "--verify", "--quiet", ref]).ok;
}
function refSha(cwd, ref, git = runGit) {
  const result = git(cwd, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  const sha = result.stdout.trim();
  return result.ok && sha ? sha : null;
}
function headSha(cwd, git = runGit) {
  const result = git(cwd, ["rev-parse", "HEAD"]);
  return result.ok ? result.stdout.trim() : null;
}
function upstream(cwd, git = runGit) {
  const result = git(cwd, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  return result.ok ? result.stdout.trim() : null;
}
function unpushedCount(cwd, git = runGit) {
  const result = git(cwd, ["rev-list", "--count", "@{u}..HEAD"]);
  if (!result.ok) return null;
  const count2 = Number(result.stdout.trim());
  return Number.isFinite(count2) ? count2 : null;
}
function commitsAhead(cwd, base2, git = runGit) {
  const result = git(cwd, ["log", LOG_FORMAT, `${base2}..HEAD`]);
  return result.ok ? parseLog(result.stdout) : [];
}
function changeCounts(cwd, git = runGit) {
  return countChanges(git(cwd, ["status", "--porcelain"]).stdout);
}
function lfsTracked(cwd, git = runGit) {
  try {
    const listing = git(cwd, ["lfs", "track"]);
    return listing.ok && parseLfsListing(listing.stdout);
  } catch {
    return false;
  }
}
function fetch(cwd, remote = "origin", options = {}, git = runGit) {
  const refs = options.refs ?? [];
  const args = refs.length > 0 ? ["fetch", "--no-tags", remote, ...refs] : ["fetch", remote];
  return git(
    cwd,
    args,
    options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : void 0
  );
}
function push(cwd, remote, branch, options = {}, git = runGit) {
  return git(cwd, ["push", ...options.setUpstream ? ["-u"] : [], remote, branch]);
}
function stashPush(cwd, message, git = runGit) {
  return git(cwd, ["stash", "push", "-u", "-m", message]);
}
function checkout(cwd, branch, git = runGit) {
  return git(cwd, ["checkout", branch]);
}
function checkoutNew(cwd, branch, base2, git = runGit) {
  return git(cwd, ["checkout", "-b", branch, ...base2 ? [base2] : []]);
}
function worktreeAdd(cwd, path8, branch, options = {}, git = runGit) {
  const create = options.create || options.base !== void 0;
  const args = create ? ["worktree", "add", path8, "-b", branch, ...options.base ? [options.base] : []] : ["worktree", "add", path8, branch];
  return git(cwd, args);
}
function lfsCheckout(cwd, git = runGit) {
  try {
    return git(cwd, ["lfs", "checkout"]);
  } catch (error) {
    return {
      ok: false,
      status: null,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error)
    };
  }
}

// ../../plugins/jira/src/storage/repository-preferences.ts
function isFetchPreference(value) {
  return value === "on" || value === "off";
}
var repositoryPreferencesCodec = {
  version: 1,
  encode: (value) => ({ fetch: value.fetch }),
  decode: (value) => {
    if (!isJsonObject(value) || !isFetchPreference(value.fetch)) return void 0;
    return { fetch: value.fetch };
  }
};
function repositoryPreferencesKey(remote) {
  const name = [remote.host, remote.workspace, remote.slug].map((part) => encodeURIComponent(part.toLowerCase())).join("/");
  return defineStorageKey(`jira/repository-preferences/${name}`, repositoryPreferencesCodec);
}
function getRepositoryPreferences(store, remote) {
  return store.get(repositoryPreferencesKey(remote));
}
function setRepositoryPreferences(store, remote, value) {
  return store.set(repositoryPreferencesKey(remote), value);
}

// ../../plugins/jira/src/branch/fetch-base.ts
var FETCH_BASE_SCHEMA = "jira-workflows/fetch-base-preference/v1";
async function setFetchBase(options) {
  const git = options.git ?? runGit;
  const stop = (reason, path8) => fail(FETCH_BASE_SCHEMA, [reason], { path: path8, repository: null, fetch: null });
  const root = topLevel(options.path, git);
  if (root === null) {
    return stop(
      { code: "not-a-git-tree", detail: `${options.path} is not inside a git working tree` },
      null
    );
  }
  const origin = remoteUrl(root, "origin", git);
  if (origin === null) {
    return stop({ code: "no-origin", detail: `${root} has no origin remote` }, root);
  }
  const remote = parseRemote(origin);
  if (remote === void 0) {
    return stop(
      {
        code: "origin-unparsed",
        detail: `Could not read a workspace and repository from ${origin}`
      },
      root
    );
  }
  await setRepositoryPreferences(options.store, remote, { fetch: options.fetch });
  return pass(FETCH_BASE_SCHEMA, {
    path: root,
    repository: remote,
    fetch: options.fetch
  });
}

// ../../plugins/jira/src/branch/prepare.ts
import { resolve } from "node:path";

// ../../packages/box-table/src/index.ts
var BLANK = Symbol("box-table blank line");
var INDENT = 2;
var CELL_CHROME = 3;
var CHROME = 2 * CELL_CHROME + 1;
var DEFAULT_LABEL = 16;
var MIN_DETAIL = 20;
var COLUMNS = 80;
function outerWidth(cells) {
  return cells.reduce((sum, cell) => sum + cell + CELL_CHROME, 1);
}
function tableWidths(columns = COLUMNS, label = DEFAULT_LABEL) {
  const safeColumns = Number.isInteger(columns) ? columns : COLUMNS;
  const safeLabel = Number.isInteger(label) ? label : DEFAULT_LABEL;
  const detail = Math.max(MIN_DETAIL, safeColumns - INDENT - CHROME - safeLabel);
  return { label: safeLabel, detail };
}
function columnWidths(columns, fixed) {
  const safeColumns = Number.isInteger(columns) ? columns : COLUMNS;
  const unfixed = fixed.filter((cell) => cell === null).length;
  if (unfixed !== 1) {
    throw new Error("box-table: columnWidths needs exactly one null (unfixed) column");
  }
  for (const cell of fixed) {
    if (cell !== null && (!Number.isInteger(cell) || cell < 1)) {
      throw new Error("box-table: every fixed column width must be an integer of at least 1");
    }
  }
  const remainder = safeColumns - INDENT - outerWidth(fixed.map((cell) => cell ?? 0));
  const cells = fixed.map((cell) => cell ?? Math.max(MIN_DETAIL, remainder));
  return { columns: cells, total: outerWidth(cells) };
}
function tableOuterWidth(widths) {
  if ("columns" in widths) {
    return widths.total;
  }
  return widths.label + widths.detail + CHROME;
}
var ANSI_REGEX = /\[[0-9;]*[a-zA-Z]/g;
var LINK_REGEX = /\[([^\]]*)\]\(([^)]*)\)/g;
var INLINE_CODE_REGEX = /`([^`]*)`/g;
var BOLD_REGEX = /\*\*([^*]*)\*\*/g;
var ESCAPE_REGEX = /\\([\\`*_[\]<>|])/g;
var WHITESPACE_REGEX = /\s+/g;
function plain(text6) {
  return text6.replace(ANSI_REGEX, "").replace(LINK_REGEX, "$1").replace(INLINE_CODE_REGEX, "$1").replace(BOLD_REGEX, "$1").replace(ESCAPE_REGEX, "$1").replace(WHITESPACE_REGEX, " ").trim();
}
var COMBINING_MARK_REGEX = new RegExp("^\\p{Mn}$", "u");
var ZERO_WIDTH_JOINER = "\u200D";
function isVariationSelector(codePoint) {
  return codePoint >= 65024 && codePoint <= 65039 || codePoint >= 917760 && codePoint <= 917999;
}
var WIDE_RANGES = [
  [4352, 4447],
  [11904, 12350],
  [12353, 13311],
  [13312, 19903],
  [19968, 40959],
  [40960, 42191],
  [44032, 55203],
  [63744, 64255],
  [65072, 65103],
  [65280, 65376],
  [65504, 65510],
  [131072, 262141]
];
function isWide(codePoint) {
  return WIDE_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}
function displayWidth(text6) {
  let width = 0;
  for (const char of text6) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (char === ZERO_WIDTH_JOINER || isVariationSelector(codePoint) || COMBINING_MARK_REGEX.test(char)) {
      continue;
    }
    width += isWide(codePoint) ? 2 : 1;
  }
  return width;
}
function cutToken(token, width) {
  let head = "";
  let cells = 0;
  for (const char of token) {
    const charWidth = displayWidth(char);
    if (cells + charWidth > width && head.length > 0) {
      break;
    }
    head += char;
    cells += charWidth;
  }
  if (head.length < token.length) {
    const hyphenAt = head.lastIndexOf("-");
    if (hyphenAt > 0 && hyphenAt < head.length - 1 && displayWidth(head.slice(0, hyphenAt + 1)) * 2 >= cells) {
      return [token.slice(0, hyphenAt + 1), token.slice(hyphenAt + 1)];
    }
  }
  return [head, token.slice(head.length)];
}
function breakToken(token, width) {
  if (displayWidth(token) <= width) {
    return [token];
  }
  const pieces = [];
  let remaining = token;
  while (remaining.length > 0) {
    const [head, rest] = cutToken(remaining, width);
    pieces.push(head);
    remaining = rest;
  }
  return pieces;
}
function wrap(text6, width) {
  if (text6.length === 0) {
    return [""];
  }
  const tokens = text6.split(" ").filter((word) => word.length > 0).flatMap((word) => breakToken(word, width));
  if (tokens.length === 0) {
    return [""];
  }
  const lines = [];
  let current = "";
  for (const token of tokens) {
    if (current === "") {
      current = token;
    } else if (displayWidth(current) + 1 + displayWidth(token) <= width) {
      current += ` ${token}`;
    } else {
      lines.push(current);
      current = token;
    }
  }
  lines.push(current);
  return lines;
}
function cellLines(cell, width) {
  const entries = typeof cell === "string" ? [cell] : cell;
  const cleaned = entries.map((entry) => entry === BLANK ? BLANK : plain(entry)).filter((entry) => entry === BLANK || entry.length > 0);
  const collapsed = cleaned.filter(
    (entry, index) => entry !== BLANK || index > 0 && index < cleaned.length - 1 && cleaned[index - 1] !== BLANK
  );
  if (collapsed.length === 0 || collapsed.every((entry) => entry === BLANK)) {
    return [""];
  }
  return collapsed.flatMap((entry) => entry === BLANK ? [""] : wrap(entry, width));
}
function validateWidths(widths) {
  if (!widths || !Number.isInteger(widths.label) || !Number.isInteger(widths.detail) || widths.label < 1 || widths.detail < 1) {
    throw new Error(
      "box-table: widths.label and widths.detail must both be integers of at least 1"
    );
  }
}
function validateColumnWidths(widths) {
  if (!widths || !Array.isArray(widths.columns) || widths.columns.length === 0 || widths.columns.some((cell) => !Number.isInteger(cell) || cell < 1)) {
    throw new Error("box-table: widths.columns must hold at least one integer of at least 1");
  }
  if (widths.total !== outerWidth(widths.columns)) {
    throw new Error(
      `box-table: widths.total (${widths.total}) does not match the columns' outer width (${outerWidth(widths.columns)})`
    );
  }
}
function padCell(text6, width) {
  return text6 + " ".repeat(Math.max(0, width - displayWidth(text6)));
}
function padCellLeft(text6, width) {
  return " ".repeat(Math.max(0, width - displayWidth(text6))) + text6;
}
function centerCell(text6, width) {
  const slack = Math.max(0, width - displayWidth(text6));
  const left = Math.floor(slack / 2);
  return " ".repeat(left) + text6 + " ".repeat(slack - left);
}
function ruleLine(cells, left, junction, right) {
  return left + cells.map((cell) => "\u2500".repeat(cell + 2)).join(junction) + right;
}
function cellsLine(texts, cells) {
  return `\u2502 ${texts.map((text6, i) => padCell(text6, cells[i] ?? 0)).join(" \u2502 ")} \u2502`;
}
function borderLine(widths, left, junction, right) {
  return ruleLine([widths.label, widths.detail], left, junction, right);
}
function rowLine(labelText, detailText, widths) {
  return cellsLine([labelText, detailText], [widths.label, widths.detail]);
}
function drawTable(table, widths) {
  validateWidths(widths);
  const lines = [borderLine(widths, "\u250C", "\u252C", "\u2510")];
  const titleLines = table.title ? cellLines(table.title, widths.detail) : [];
  const hasTitle = !(titleLines.length === 0 || titleLines.length === 1 && titleLines[0] === "");
  let previousRow = false;
  if (hasTitle) {
    for (const titleLine of titleLines) {
      lines.push(rowLine("", centerCell(titleLine, widths.detail), widths));
    }
    previousRow = true;
  }
  for (const [label, detail] of table.rows) {
    if (previousRow) {
      lines.push(borderLine(widths, "\u251C", "\u253C", "\u2524"));
    }
    const labelLines = cellLines(label, widths.label);
    const detailLines2 = cellLines(detail, widths.detail);
    const height = Math.max(labelLines.length, detailLines2.length);
    for (let i = 0; i < height; i++) {
      lines.push(rowLine(labelLines[i] ?? "", detailLines2[i] ?? "", widths));
    }
    previousRow = true;
  }
  lines.push(borderLine(widths, "\u2514", "\u2534", "\u2518"));
  return lines;
}
function drawPanel(panel, widths) {
  validateWidths(widths);
  const contentWidth = tableOuterWidth(widths) - 4;
  const top = `\u250C${"\u2500".repeat(contentWidth + 2)}\u2510`;
  const mid = `\u251C${"\u2500".repeat(contentWidth + 2)}\u2524`;
  const bottom = `\u2514${"\u2500".repeat(contentWidth + 2)}\u2518`;
  const lines = [top];
  const titleLines = cellLines(panel.title, contentWidth);
  for (const titleLine of titleLines) {
    lines.push(`\u2502 ${centerCell(titleLine, contentWidth)} \u2502`);
  }
  lines.push(mid);
  const bodyLines = cellLines(panel.detail, contentWidth);
  for (const bodyLine of bodyLines) {
    lines.push(`\u2502 ${padCell(bodyLine, contentWidth)} \u2502`);
  }
  lines.push(bottom);
  return lines;
}
var NUMBER_REGEX = /^\d+$/;
function alignCell(text6, width, column) {
  return column === 0 && NUMBER_REGEX.test(text6) ? padCellLeft(text6, width) : padCell(text6, width);
}
function validateCellCount(cells, count2, what) {
  if (cells.length !== count2) {
    throw new Error(`box-table: ${what} has ${cells.length} cells, expected ${count2}`);
  }
}
function drawColumns(spec, widths) {
  validateColumnWidths(widths);
  const cells = widths.columns;
  const count2 = cells.length;
  const spanWidth = widths.total - 4;
  const titleLines = spec.title ? cellLines(spec.title, spanWidth) : [];
  const hasTitle = !(titleLines.length === 0 || titleLines.length === 1 && titleLines[0] === "");
  const lines = [];
  if (hasTitle) {
    lines.push(`\u250C${"\u2500".repeat(spanWidth + 2)}\u2510`);
    for (const titleLine of titleLines) {
      lines.push(`\u2502 ${centerCell(titleLine, spanWidth)} \u2502`);
    }
    lines.push(ruleLine(cells, "\u251C", "\u252C", "\u2524"));
  } else {
    lines.push(ruleLine(cells, "\u250C", "\u252C", "\u2510"));
  }
  const header = spec.header ?? [];
  const hasHeader = header.some((cell) => plain(cell).length > 0);
  if (hasHeader) {
    validateCellCount(header, count2, "header");
  }
  for (const row of spec.rows) {
    validateCellCount(row, count2, "a row");
  }
  const drawRow = (row) => {
    const columnLines = row.map((cell, i) => cellLines(cell, cells[i] ?? 0));
    const height = Math.max(...columnLines.map((column) => column.length));
    for (let line = 0; line < height; line++) {
      const texts = columnLines.map((column, i) => alignCell(column[line] ?? "", cells[i] ?? 0, i));
      lines.push(`\u2502 ${texts.join(" \u2502 ")} \u2502`);
    }
  };
  let previousRow = false;
  if (hasHeader) {
    drawRow(header);
    previousRow = true;
  }
  for (const row of spec.rows) {
    if (previousRow) {
      lines.push(ruleLine(cells, "\u251C", "\u253C", "\u2524"));
    }
    drawRow(row);
    previousRow = true;
  }
  lines.push(ruleLine(cells, "\u2514", "\u2534", "\u2518"));
  return lines;
}
function fence(lines) {
  return ["```", ...lines, "```", ""].join("\n");
}
function fencedTable(table, widths) {
  return fence(drawTable(table, widths));
}
function fencedPanel(panel, widths) {
  return fence(drawPanel(panel, widths));
}
function fencedColumns(spec, widths) {
  return fence(drawColumns(spec, widths));
}

// ../../plugins/jira/src/panels/text.ts
var MAX_URL_CHARACTERS = 200;
var ANSI_REGEX2 = /\u001b\[[0-?]*[ -/]*[@-~]/g;
var CONTROL_REGEX = /[\u0000-\u001f\u007f]/g;
var ESCAPE_REGEX2 = /\u001b/;
function sanitize(value) {
  return String(value ?? "").replace(ANSI_REGEX2, "").replace(CONTROL_REGEX, " ").replace(/\s+/g, " ").trim();
}
function safeUrl(value) {
  let parsed;
  try {
    parsed = new URL(sanitize(value));
  } catch {
    return void 0;
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    return void 0;
  }
  return Array.from(parsed.href).length <= MAX_URL_CHARACTERS ? parsed.href : void 0;
}
function checkText(value, what) {
  const text6 = String(value ?? "").trim();
  if (text6 === "") {
    throw new TypeError(`${what} is empty`);
  }
  if (text6.includes("\u2026")) {
    throw new TypeError(`${what} contains an ellipsis character; write three full stops`);
  }
  if (ESCAPE_REGEX2.test(text6)) {
    throw new TypeError(`${what} contains an escape sequence; a panel carries no colour`);
  }
  return text6;
}
function checkValue(value, what) {
  const text6 = checkText(value, what);
  if (/[\n\r]/.test(text6)) {
    throw new TypeError(`${what} spans two lines; an action is one cell`);
  }
  return text6;
}

// ../../plugins/jira/src/panels/action.ts
var ACTED = "\u21AF";
var ACTIONS = {
  stashed: { label: "Stashed", values: ["stash"], line: (v) => v.stash },
  "branch-created": {
    label: "Branch created",
    values: ["branch", "base"],
    line: (v) => `${v.branch} off ${v.base}`
  },
  "worktree-created": {
    label: "Worktree created",
    values: ["path", "branch"],
    line: (v) => `${v.branch} at ${v.path}`
  },
  transitioned: {
    label: "Transitioned",
    values: ["from", "to"],
    line: (v) => `${v.from} \u2192 ${v.to}`
  },
  committed: {
    label: "Committed",
    values: ["sha", "tree"],
    line: (v) => `${v.sha}, tree ${v.tree}`
  },
  pushed: { label: "Pushed", values: ["branch"], line: (v) => v.branch },
  "pull-request-raised": { label: "Pull request raised", values: ["url"], line: (v) => v.url },
  "summary-posted": {
    label: "Summary posted",
    values: ["comment"],
    line: (v) => `comment ${v.comment}`
  }
};
var ACTION_KEYS = Object.keys(ACTIONS);
function isActionKey(value) {
  return Object.hasOwn(ACTIONS, value);
}
function actionPanel(key, given, widths = tableWidths()) {
  const name = String(key ?? "").trim();
  if (!isActionKey(name)) {
    throw new TypeError(`No action "${name}"; use one of ${ACTION_KEYS.join(", ")}`);
  }
  const action = ACTIONS[name];
  const takes = action.values.join(", ");
  if (typeof given === "string" && action.values.length !== 1) {
    throw new TypeError(`Action ${name} takes ${takes}, so it takes no bare value`);
  }
  const values = typeof given === "string" ? { [action.values[0]]: given } : given;
  if (typeof values !== "object" || values === null || Array.isArray(values)) {
    throw new TypeError("Expected an object of values");
  }
  for (const passed of Object.keys(values)) {
    if (!action.values.includes(passed)) {
      throw new TypeError(`Action ${name} has no ${passed} value; it takes ${takes}`);
    }
  }
  const checked = {};
  for (const wanted of action.values) {
    if (values[wanted] === void 0) {
      throw new TypeError(`Action ${name} needs a ${wanted} value`);
    }
    checked[wanted] = checkValue(values[wanted], `Action ${name}'s ${wanted}`);
  }
  return fencedPanel({ title: `${ACTED} ${action.label}`, detail: action.line(checked) }, widths);
}

// ../../plugins/jira/src/site/identifiers.ts
function asCloudId(value) {
  return asNonEmptyString(value, "cloudId");
}
function asProjectId(value) {
  return asNonEmptyString(value, "projectId");
}
function asProjectKey(value) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid Jira project key: ${value}`);
  }
  return value;
}
function asIssueKey(value) {
  if (!/^[A-Za-z][A-Za-z0-9_]*-[0-9]+$/.test(value)) {
    throw new Error(`Invalid Jira issue key: ${value}`);
  }
  return value;
}
function issueKeyArgument(value) {
  try {
    return asIssueKey(value);
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
}
function projectKeyOfIssueKey(issueKey) {
  return asProjectKey(issueKey.slice(0, issueKey.indexOf("-")));
}
function asNonEmptyString(value, name) {
  if (value.length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  return value;
}

// ../../plugins/jira/src/site/site-matcher.ts
function matchSite(sites, siteInForce, accessors) {
  const needle = normalizeSiteId(siteInForce);
  return sites.find(
    (site) => accessors.cloudId(site).toLowerCase() === needle || normalizeSiteId(accessors.url(site)) === needle || accessors.name(site).toLowerCase() === needle || hostLabel(accessors.url(site)) === needle
  );
}
function normalizeSiteId(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
}
function hostLabel(url) {
  return normalizeSiteId(url).split(".")[0] ?? "";
}
function siteOrigin(site) {
  if (site.includes("://")) return site.replace(/\/+$/, "");
  return site.includes(".") ? `https://${site}` : `https://${site}.atlassian.net`;
}
function browseUrl(site, key) {
  return `${siteOrigin(site)}/browse/${key}`;
}

// ../../plugins/jira/src/site/cloud-id-resolver.ts
var cloudSiteAccessors = {
  cloudId: (site) => site.cloudId,
  name: (site) => site.tenantName,
  url: (site) => site.siteUrl
};
function pickIndexedSite(sites, site) {
  if (site !== void 0) return matchSite(sites, site, cloudSiteAccessors);
  return sites.length === 1 ? sites[0] : void 0;
}
async function resolveCloudId(options) {
  return (await resolveCloudSite(options)).cloudId;
}
async function resolveCloudSite(options) {
  const { key, site, memory } = options;
  const projectKey = projectKeyOfIssueKey(key);
  const sites = await memory.getCloudSites(projectKey);
  if (sites.length === 0) {
    throw new Error(
      `No Jira site is indexed for project "${projectKey}". Run "work-item get --key ${key}" first; nothing was read or written.`
    );
  }
  const picked = pickIndexedSite(sites, site);
  if (picked !== void 0) {
    return picked;
  }
  if (site !== void 0) {
    throw new Error(
      `"${site}" does not match any Jira site indexed for project "${projectKey}". ${listCandidates(sites)} Nothing was read or written.`
    );
  }
  throw new Error(
    `Multiple Jira sites are indexed for project "${projectKey}"; pass --site to pick one. ${listCandidates(sites)} Nothing was read or written.`
  );
}
function listCandidates(sites) {
  const lines = sites.map((site) => `  - ${site.tenantName} (${site.siteUrl})`).join("\n");
  return `Candidate sites:
${lines}`;
}

// ../../plugins/jira/src/site/indexed-site.ts
async function resolveIndexedSite(memory, key) {
  const projectKey = projectKeyOf(key.toUpperCase());
  if (projectKey === void 0) return void 0;
  const site = await memory.getCloudSite(projectKey);
  return site?.tenantName;
}
async function resolveIndexedProject(memory, key, site) {
  const projectKey = projectKeyOf(key.toUpperCase());
  if (projectKey === void 0) return void 0;
  return pickIndexedSite(await memory.getCloudSites(projectKey), site);
}
function projectKeyOf(key) {
  try {
    return projectKeyOfIssueKey(asIssueKey(key));
  } catch {
  }
  try {
    return asProjectKey(key);
  } catch {
    return void 0;
  }
}

// ../../packages/adf/src/index.ts
function adfToMarkdown(doc, options = {}) {
  const context = { headingOffset: options.headingOffset ?? 0 };
  return `${renderBlocks(doc.content, context)}
`;
}
var CELL_TYPES = /* @__PURE__ */ new Set(["tableHeader", "tableCell"]);
function attr(attrs, key) {
  const value = attrs?.[key];
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function renderBlocks(nodes, context) {
  return (nodes ?? []).map((node) => renderBlock(node, context)).filter((text6) => text6 !== "").join("\n\n");
}
function renderBlock(node, context) {
  switch (node.type) {
    case "heading": {
      const raw = typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      const level = clamp(raw + context.headingOffset, 1, 6);
      const text6 = renderInline(node.content).trim();
      return text6 === "" ? "" : `${"#".repeat(level)} ${text6}`;
    }
    case "paragraph":
      return renderInline(node.content).trim();
    case "bulletList":
    case "orderedList":
      return renderList(node, context);
    case "codeBlock":
      return `\`\`\`${attr(node.attrs, "language")}
${rawText(node)}
\`\`\``;
    case "blockquote":
      return quote(renderBlocks(node.content, context));
    case "panel": {
      const kind = attr(node.attrs, "panelType");
      const body = quote(renderBlocks(node.content, context));
      if (kind === "") {
        return body;
      }
      return body === "" ? `> **${kind}**` : `> **${kind}**
${body}`;
    }
    case "rule":
      return "---";
    case "table":
      return renderTable(node, context);
    case "media":
    case "mediaSingle":
    case "mediaGroup":
      return "[media]";
    case "expand":
    case "nestedExpand": {
      const title = `**${attr(node.attrs, "title") || "details"}**`;
      const body = renderBlocks(node.content, context);
      return body === "" ? title : `${title}

${body}`;
    }
    case "blockCard":
      return attr(node.attrs, "url");
    default:
      return renderBlocks(node.content, context);
  }
}
function renderList(node, context) {
  const ordered = node.type === "orderedList";
  let index = ordered && typeof node.attrs?.order === "number" ? node.attrs.order : 1;
  const items = [];
  for (const item of node.content ?? []) {
    if (item.type !== "listItem") {
      continue;
    }
    const marker = ordered ? `${index}. ` : "- ";
    index += 1;
    const body = (item.content ?? []).map((child) => renderBlock(child, context)).filter((text6) => text6 !== "").join("\n");
    if (body === "") {
      items.push(marker.trimEnd());
      continue;
    }
    items.push(
      body.split("\n").map((line, i) => i === 0 ? `${marker}${line}` : line === "" ? "" : `  ${line}`).join("\n")
    );
  }
  return items.join("\n");
}
function renderTable(node, context) {
  const rows = (node.content ?? []).filter((row) => row.type === "tableRow").map(
    (row) => (row.content ?? []).filter((cell) => CELL_TYPES.has(cell.type)).map(
      (cell) => renderBlocks(cell.content, context).replace(/\n+/g, " ").replace(/\|/g, "\\|").trim()
    )
  );
  const width = Math.max(0, ...rows.map((row) => row.length));
  if (width === 0) {
    return "";
  }
  const line = (cells) => `| ${Array.from({ length: width }, (_2, i) => cells[i] ?? "").join(" | ")} |`;
  const [header, ...body] = rows;
  return [
    line(header ?? []),
    line(Array.from({ length: width }, () => "---")),
    ...body.map(line)
  ].join("\n");
}
function quote(text6) {
  if (text6 === "") {
    return "";
  }
  return text6.split("\n").map((line) => `> ${line}`.trimEnd()).join("\n");
}
function rawText(node) {
  if (typeof node.text === "string") {
    return node.text;
  }
  return (node.content ?? []).map(rawText).join("");
}
function renderInline(nodes) {
  return (nodes ?? []).map(renderInlineNode).join("");
}
function renderInlineNode(node) {
  switch (node.type) {
    case "text":
      return applyMarks(String(node.text ?? ""), node.marks);
    case "hardBreak":
      return "\n";
    case "mention": {
      const name = attr(node.attrs, "text").replace(/^@/, "");
      return `@${name === "" ? "unknown" : name}`;
    }
    case "emoji":
      return attr(node.attrs, "shortName") || attr(node.attrs, "text");
    case "inlineCard":
    case "blockCard":
      return attr(node.attrs, "url");
    case "status": {
      const text6 = attr(node.attrs, "text");
      return text6 === "" ? "" : `[${text6}]`;
    }
    case "date":
      return isoDate(attr(node.attrs, "timestamp"));
    default:
      return renderInline(node.content);
  }
}
function isoDate(timestamp2) {
  const ms = Number(timestamp2);
  if (timestamp2 === "" || !Number.isFinite(ms)) {
    return timestamp2;
  }
  return new Date(ms).toISOString().slice(0, 10);
}
function applyMarks(text6, marks) {
  if (text6 === "" || marks === void 0 || marks.length === 0) {
    return text6;
  }
  const types = new Set(marks.map((mark) => mark.type));
  if (types.has("code")) {
    return `\`${text6}\``;
  }
  let out = text6;
  if (types.has("em")) {
    out = `*${out}*`;
  }
  if (types.has("strong")) {
    out = `**${out}**`;
  }
  const href = attr(marks.find((mark) => mark.type === "link")?.attrs, "href");
  if (href !== "") {
    out = `[${out}](${href})`;
  }
  return out;
}

// ../../plugins/jira/src/work-item/markdown.ts
function markdownFromAdf(value) {
  if (value !== void 0 && isJsonObject(value) && value.type === "doc" && Array.isArray(value.content)) {
    return adfToMarkdown(value).trimEnd();
  }
  return value;
}
function markdownComment(comment) {
  if (!isJsonObject(comment) || comment.body === void 0) {
    return comment;
  }
  return { ...comment, body: markdownFromAdf(comment.body) };
}
function markdownThread(thread) {
  return Array.isArray(thread) ? thread.map(markdownComment) : thread;
}
function markdownizeWorkItem(item) {
  const result = { ...item };
  if (result.description !== void 0) {
    result.description = markdownFromAdf(result.description);
  }
  if (result.comments !== void 0) {
    result.comments = markdownThread(result.comments);
  }
  const block2 = result.comment;
  if (isJsonObject(block2) && block2.comments !== void 0) {
    result.comment = { ...block2, comments: markdownThread(block2.comments) };
  }
  return result;
}

// ../../plugins/jira/src/work-item/ingest.ts
var NOISE_KEYS = /* @__PURE__ */ new Set([
  "self",
  "avatarUrls",
  "iconUrl",
  "id",
  "accountId",
  "entityId",
  "uuid"
]);
var KEEP_WHOLE = /* @__PURE__ */ new Set([
  "summary",
  "status",
  "issuetype",
  "key",
  "parent",
  "description"
]);
var ISSUE_KEY_RE = /[A-Z][A-Z0-9]+-\d+/g;
var NON_KEY_PREFIXES = /* @__PURE__ */ new Set([
  "ANSI",
  "ASCII",
  "AES",
  "AVX",
  "CVE",
  "CWE",
  "DDR",
  "ECMA",
  "FIPS",
  "GMT",
  "HTTP",
  "HTTPS",
  "IEC",
  "ISO",
  "JSR",
  "NIST",
  "OWASP",
  "PEP",
  "RFC",
  "RSA",
  "SATA",
  "SHA",
  "SSE",
  "SSL",
  "TLS",
  "USB",
  "UTC",
  "UTF",
  "WCAG"
]);
function extractIssueKeys(text6) {
  const keys = [];
  for (const match of String(text6 ?? "").matchAll(ISSUE_KEY_RE)) {
    const candidate = match[0];
    if (!NON_KEY_PREFIXES.has(candidate.slice(0, candidate.lastIndexOf("-"))) && !keys.includes(candidate)) {
      keys.push(candidate);
    }
  }
  return keys;
}
function extractFirstIssueKey(text6) {
  return extractIssueKeys(text6)[0];
}
function unwrapWorkItemEnvelope(value) {
  const data = isJsonObject(value) && "data" in value ? value.data : value;
  const item = Array.isArray(data) ? data[0] : data;
  return item !== void 0 && isJsonValue(item) && isJsonObject(item) ? item : void 0;
}
function hoistFields(item) {
  const fields = item.fields;
  if (!isJsonObject(fields)) {
    return item;
  }
  const rest = { ...item };
  delete rest.fields;
  return { ...fields, ...rest };
}
function stripNoiseKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripNoiseKeys);
  }
  if (isJsonObject(value)) {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      if (!NOISE_KEYS.has(key)) {
        result[key] = stripNoiseKeys(nested);
      }
    }
    return result;
  }
  return value;
}
function truncateForBudget(item, maxLength) {
  const truncatedFields = [];
  const result = {};
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === "string" && !KEEP_WHOLE.has(key) && value.length > maxLength) {
      result[key] = `${value.slice(0, maxLength)}\u2026`;
      truncatedFields.push(key);
    } else {
      result[key] = value;
    }
  }
  return { item: result, truncatedFields };
}
function commentsOf(item) {
  if (Array.isArray(item.comments) && item.comments.length > 0) {
    return item.comments;
  }
  const nested = item.comment?.comments;
  return Array.isArray(nested) ? nested : [];
}
var AGENT_VIEW_FIELDS = [
  "key",
  "summary",
  "status",
  "issuetype",
  "priority",
  "resolution",
  "assignee",
  "reporter",
  "parent",
  "labels",
  "components",
  "fixVersions",
  "duedate",
  "created",
  "updated",
  "remoteLinks",
  "issuelinks",
  "site"
];
function agentView(item) {
  const view = {};
  for (const field of AGENT_VIEW_FIELDS) {
    if (item[field] !== void 0) {
      view[field] = item[field];
    }
  }
  if (item.description !== void 0) {
    view.description = item.description;
  }
  if (item.comments !== void 0 || item.comment !== void 0) {
    view.comments = commentsOf(item);
  }
  const shown = (item._truncated ?? "").split(",").filter((name) => name in view);
  if (shown.length > 0) {
    view._truncated = shown.join(",");
  }
  return view;
}
var DEFAULT_MAX_FIELD_LENGTH = 4e3;
function prepareWorkItemForStorage(cloudId, raw, options = {}) {
  const unwrapped = unwrapWorkItemEnvelope(raw);
  if (unwrapped === void 0) {
    throw new Error("No work item found in the payload");
  }
  const hoisted = hoistFields(unwrapped);
  const stripped = stripNoiseKeys(hoisted);
  if (!isJsonObject(stripped)) {
    throw new Error("No work item found in the payload");
  }
  const maxFieldLength = options.maxFieldLength ?? DEFAULT_MAX_FIELD_LENGTH;
  const { item: truncated, truncatedFields } = truncateForBudget(
    markdownizeWorkItem(stripped),
    maxFieldLength
  );
  const key = truncated.key;
  const summary = truncated.summary;
  const status = decodeRequiredStatus(truncated.status);
  const issuetype = decodeRequiredNamedEntity(truncated.issuetype);
  if (typeof key !== "string" || typeof summary !== "string" || status === void 0 || issuetype === void 0) {
    throw new Error(
      "Work item payload is missing a required field: key, summary, status, or issuetype"
    );
  }
  return {
    ...truncated,
    cloudId,
    key: asIssueKey(key),
    summary,
    status,
    issuetype,
    ...options.site !== void 0 ? { site: options.site } : {},
    ...truncatedFields.length > 0 ? { _truncated: truncatedFields.join(",") } : {}
  };
}
function decodeRequiredNamedEntity(value) {
  return value !== void 0 && isJsonObject(value) && typeof value.name === "string" ? { name: value.name } : void 0;
}
function decodeRequiredStatus(value) {
  if (value === void 0 || !isJsonObject(value) || typeof value.name !== "string") {
    return void 0;
  }
  const statusCategory = decodeStatusCategoryForIngest(value.statusCategory);
  return { name: value.name, ...statusCategory !== void 0 ? { statusCategory } : {} };
}
function decodeStatusCategoryForIngest(value) {
  if (value === void 0 || !isJsonObject(value) || typeof value.key !== "string") {
    return void 0;
  }
  return { key: value.key, ...typeof value.name === "string" ? { name: value.name } : {} };
}

// ../../plugins/jira/src/storage/codec-utils.ts
var INVALID = Symbol("invalid");
function stringProperty(value, key) {
  const property = value[key];
  return typeof property === "string" && property.length > 0 ? property : void 0;
}
function numberProperty(value, key) {
  const property = value[key];
  return typeof property === "number" && Number.isFinite(property) ? property : void 0;
}
function decodeArray(values, decodeItem) {
  const decoded = values.flatMap((item) => {
    const result = decodeItem(item);
    return result === void 0 ? [] : [result];
  });
  return decoded.length === values.length ? decoded : void 0;
}

// ../../plugins/jira/src/storage/link-signal.ts
var LINK_SOURCES = [
  "claim",
  "workItemFetch",
  "workItemCreate",
  "comment",
  "branchName",
  "jiraLaunch",
  "unknown"
];
function isLinkSource(value) {
  return typeof value === "string" && LINK_SOURCES.includes(value);
}
var KEY_PREFIX = "jira/link-signals/";
var jiraLinkSignalCodec = {
  version: 1,
  encode: encodeJiraLinkSignal,
  decode: decodeJiraLinkSignal
};
var jiraLinkSignalKeys = {
  signal(cloudId, issueKey) {
    return defineStorageKey(
      `${KEY_PREFIX}${encodeURIComponent(cloudId)}/${encodeURIComponent(issueKey)}`,
      jiraLinkSignalCodec
    );
  }
};
function createJiraLinkSignalStore(store) {
  return {
    recordPending: async (signal) => {
      const key = jiraLinkSignalKeys.signal(signal.cloudId, signal.issueKey);
      const existing = await store.get(key);
      if (existing !== void 0 && existing.sent) {
        return true;
      }
      await store.set(key, {
        ...signal,
        sent: false,
        recordedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return existing !== void 0;
    },
    has: async (cloudId, issueKey) => await store.get(jiraLinkSignalKeys.signal(cloudId, issueKey)) !== void 0,
    listPending: async () => (await listRecorded(store)).filter((signal) => !signal.sent),
    listRecorded: () => listRecorded(store),
    markSent: async (cloudId, issueKey) => {
      const key = jiraLinkSignalKeys.signal(cloudId, issueKey);
      const existing = await store.get(key);
      if (existing !== void 0 && !existing.sent) {
        await store.set(key, { ...existing, sent: true });
      }
    }
  };
}
async function listRecorded(store) {
  const records = await store.records();
  const signals = [];
  for (const record of records) {
    if (!record.key.startsWith(KEY_PREFIX)) {
      continue;
    }
    const decoded = jiraLinkSignalCodec.decode(record.value);
    if (decoded !== void 0) {
      signals.push(decoded);
    }
  }
  return signals;
}
function encodeJiraLinkSignal(value) {
  return {
    cloudId: value.cloudId,
    issueKey: value.issueKey,
    ...value.issueId !== void 0 ? { issueId: value.issueId } : {},
    ...value.projectId !== void 0 ? { projectId: value.projectId } : {},
    ...value.linkSource !== void 0 ? { linkSource: value.linkSource } : {},
    sent: value.sent,
    recordedAt: value.recordedAt
  };
}
function decodeJiraLinkSignal(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const cloudId = stringProperty(value, "cloudId");
  const issueKey = stringProperty(value, "issueKey");
  const recordedAt = stringProperty(value, "recordedAt");
  if (cloudId === void 0 || issueKey === void 0 || recordedAt === void 0) {
    return void 0;
  }
  if (typeof value.sent !== "boolean") {
    return void 0;
  }
  const issueId = stringProperty(value, "issueId");
  const projectId = stringProperty(value, "projectId");
  if (value.issueId !== void 0 && issueId === void 0 || value.projectId !== void 0 && projectId === void 0) {
    return void 0;
  }
  const linkSource = isLinkSource(value.linkSource) ? value.linkSource : void 0;
  try {
    return {
      cloudId: asCloudId(cloudId),
      issueKey: asIssueKey(issueKey),
      ...issueId !== void 0 ? { issueId } : {},
      ...projectId !== void 0 ? { projectId } : {},
      ...linkSource !== void 0 ? { linkSource } : {},
      sent: value.sent,
      recordedAt
    };
  } catch {
    return void 0;
  }
}

// ../../plugins/jira/src/signals/asset-retrieval.ts
var RETRIEVAL_SOURCES = ["local", "liveAtlassian"];
function safeAssets(assets) {
  return assets.filter(
    (asset) => isAssetType(asset.objectType) && (typeof asset.objectId === "number" && Number.isSafeInteger(asset.objectId) && asset.objectId >= 0 || typeof asset.objectId === "string" && (/^\d+$/.test(asset.objectId) || /^ari:cloud:[a-z]+:[\w:./-]+$/.test(asset.objectId)))
  ).slice(0, 32).map((asset) => ({
    objectType: asset.objectType,
    objectId: /^\d+$/.test(String(asset.objectId)) && Number.isSafeInteger(Number(asset.objectId)) ? Number(asset.objectId) : asset.objectId
  }));
}
function isAssetRead(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value;
  return isAssetType(v.assetType) && Number.isSafeInteger(v.assetCount) && Number(v.assetCount) > 0 && (v.issueId === void 0 || typeof v.issueId === "string") && (v.siteSource === void 0 || ["explicit", "index", "twgDefault"].includes(String(v.siteSource))) && RETRIEVAL_SOURCES.includes(v.retrievalSource) && (v.retrievedAssets === void 0 || Array.isArray(v.retrievedAssets) && v.retrievedAssets.every(
    (a) => a !== null && typeof a === "object" && !Array.isArray(a) && isAssetType(a.objectType) && ["string", "number"].includes(typeof a.objectId)
  ));
}

// ../../plugins/jira/src/signals/command-analytics.ts
import { spawn } from "node:child_process";

// ../../plugins/jira/src/signals/sanitize.ts
import { createHash } from "node:crypto";

// ../../plugins/jira/src/signals/signal-log.ts
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join as join2 } from "node:path";
import os2 from "node:os";
function resolveSignalLogPath(env = process.env) {
  return env.JIRA_SIGNAL_LOG_PATH ?? join2(os2.tmpdir(), "jira-session-signal.log");
}
function isSignalLogEnabled(env = process.env) {
  return env.JIRA_SIGNAL_DEBUG === "1";
}
var defaultWriter = (path8, line) => {
  mkdirSync(dirname(path8), { recursive: true });
  appendFileSync(path8, line);
};
function logSignalEvent(event, fields, options = {}) {
  const env = options.env ?? process.env;
  if (!isSignalLogEnabled(env)) {
    return;
  }
  try {
    const write = options.write ?? defaultWriter;
    const line = `${JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), event, ...fields })}
`;
    write(resolveSignalLogPath(env), line);
  } catch {
  }
}

// ../../plugins/jira/src/signals/sanitize.ts
var HASH_SALT = "atlassian-agent-plugins/analytics/v1";
var INTERNAL_EMAIL_DOMAIN = "atlassian.com";
function hashIdentifier(value) {
  return createHash("sha256").update(`${HASH_SALT}\0${value}`, "utf8").digest("hex");
}
function classifyUser(email) {
  if (typeof email !== "string") {
    return "external";
  }
  const at2 = email.lastIndexOf("@");
  return at2 > 0 && email.slice(at2 + 1).toLowerCase() === INTERNAL_EMAIL_DOMAIN ? "internal" : "external";
}
var SHARED_ATTRIBUTES = [
  "sessionID",
  "conversationId",
  "singleInstrumentationID",
  "aiFeatureName",
  "experienceID",
  "hostPlatform",
  "pluginVersion",
  "cliVersion",
  "isAIFeature",
  "userGeneratedAI",
  "userSegment",
  "isOrphanedSession",
  "linkedJiraIssueId",
  "linkedJiraProjectId",
  "sessionTrigger"
];
var EVENT_ATTRIBUTES = {
  "aiSession linked": ["linkSource", "linkPromptShown"],
  "aiInteraction initiated": ["proactiveGeneratedAI", "sessionStartedTimestamp"],
  "aiSessionSkill accessed": ["skillName", "skillInvocationSource"],
  "aiSessionCommand completed": [
    "commandPath",
    "verdictStatus",
    "reasonCodes",
    "exitCode",
    "durationMs",
    "invokedBy",
    "templateSource",
    "memoryResultCount",
    "memoryFailureStage"
  ],
  "aiInteraction error": ["aiErrorCode", "aiErrorMessage", "errorStage", "commandPath"],
  "asset retrieved": [
    "retrievedAssets",
    "retrievalSource",
    "siteSource",
    "assetType",
    "assetCount",
    "retrievalMethod"
  ],
  "aiResult adopted": ["aiResultAction", "artefactsCreated"]
};
var ATTRIBUTE_ALLOWLISTS = Object.fromEntries(
  Object.entries(EVENT_ATTRIBUTES).map(([event, own]) => [
    event,
    /* @__PURE__ */ new Set([...SHARED_ATTRIBUTES, ...own])
  ])
);
function allowlisted(eventName, attributes, log = {}) {
  const allowed = ATTRIBUTE_ALLOWLISTS[eventName];
  const kept = {};
  const dropped = [];
  for (const [name, value] of Object.entries(attributes)) {
    if (allowed?.has(name) === true) {
      kept[name] = value;
    } else {
      dropped.push(name);
    }
  }
  if (dropped.length > 0) {
    logSignalEvent("analytics-attribute-dropped", { eventName, dropped }, log);
  }
  return kept;
}

// ../../plugins/jira/src/storage/session-markers.ts
var sessionMarkerCodec = {
  version: 1,
  encode: (value) => ({ claimedAt: value.claimedAt }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const claimedAt = stringProperty(value, "claimedAt");
    return claimedAt === void 0 ? void 0 : { claimedAt };
  }
};
function sessionMarkerKey(name) {
  return defineStorageKey(`jira/markers/${encodeURIComponent(name)}`, sessionMarkerCodec);
}
function claimMarker(store, name) {
  return store.claim(sessionMarkerKey(name), { claimedAt: (/* @__PURE__ */ new Date()).toISOString() });
}
function hasMarker(store, name) {
  return store.has(sessionMarkerKey(name));
}
function releaseMarker(store, name) {
  return store.delete(sessionMarkerKey(name));
}

// ../../plugins/jira/src/storage/work-item.ts
var WORK_ITEM_FIELDS = [
  "cloudId",
  "key",
  "summary",
  "status",
  "issuetype",
  "priority",
  "resolution",
  "assignee",
  "reporter",
  "parent",
  "labels",
  "components",
  "fixVersions",
  "duedate",
  "created",
  "updated",
  "description",
  "remoteLinks",
  "issuelinks",
  "comment",
  "comments",
  "site",
  "_truncated"
];
var PROJECT_CONTEXT_FIELDS = [
  "cloudId",
  "projectId",
  "projectKey",
  "projectName",
  "tenantName",
  "siteUrl",
  "lastSeenAt"
];
var CLOUD_SITE_FIELDS = [
  "cloudId",
  "projectId",
  "projectKey",
  "tenantName",
  "siteUrl"
];
var jiraProjectContextCodec = {
  version: 1,
  encode: encodeJiraProjectContext,
  decode: decodeJiraProjectContext
};
var jiraProjectKeyIndexCodec = {
  version: 1,
  encode: encodeJiraProjectKeyIndex,
  decode: decodeJiraProjectKeyIndex
};
var jiraWorkItemCodec = {
  version: 4,
  encode: encodeJiraWorkItem,
  decode: decodeJiraWorkItem,
  migrations: {
    // v1 predates `sections`, which v4 removed again; v1 differs from v4 only
    // in the rich text, so it migrates the way v3 does.
    1: migrateRichTextToMarkdown,
    // v2 predates `status.statusCategory`; that field is optional, so only
    // the rich text differs from v4.
    2: migrateRichTextToMarkdown,
    // v3 held the description and comment bodies as ADF, and a parsed `sections`.
    3: migrateRichTextToMarkdown
  }
};
function migrateRichTextToMarkdown(value) {
  if (!isJsonObject(value)) {
    return value;
  }
  const migrated = { ...markdownizeWorkItem(value) };
  delete migrated.sections;
  return migrated;
}
var WORK_ITEM_KEY_PREFIX = CONTENT.workItem.keyPrefix;
var jiraKeys = {
  projectContext(cloudId, projectId) {
    return defineStorageKey(
      `${CONTENT.project.keyPrefix}${encodeURIComponent(cloudId)}/${encodeURIComponent(projectId)}`,
      jiraProjectContextCodec
    );
  },
  projectKeyIndex(projectKey) {
    return defineStorageKey(
      `${CONTENT.site.keyPrefix}${encodeURIComponent(projectKey)}`,
      jiraProjectKeyIndexCodec
    );
  },
  /**
   * Scoped by `cloudId` as well as `issueKey`: a same-keyed item on a
   * different site must not collide in storage with this one. See
   * "Cache identity and site" in agent-docs/jira-schemas/README.md.
   */
  workItem(cloudId, issueKey) {
    return defineStorageKey(
      `${WORK_ITEM_KEY_PREFIX}${encodeURIComponent(cloudId)}/${encodeURIComponent(issueKey)}`,
      jiraWorkItemCodec
    );
  }
};
function parseWorkItemKeyName(name) {
  if (!name.startsWith(WORK_ITEM_KEY_PREFIX)) {
    return void 0;
  }
  const rest = name.slice(WORK_ITEM_KEY_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash === -1) {
    return void 0;
  }
  try {
    return {
      cloudId: asCloudId(decodeURIComponent(rest.slice(0, slash))),
      issueKey: asIssueKey(decodeURIComponent(rest.slice(slash + 1)))
    };
  } catch {
    return void 0;
  }
}
function createJiraMemory(stores) {
  return {
    ...stores,
    getProjectContext: (cloudId, projectId) => stores.plugin.get(jiraKeys.projectContext(cloudId, projectId)),
    setProjectContext: async (value) => {
      const contextKey = jiraKeys.projectContext(value.cloudId, value.projectId);
      const previous = await stores.plugin.get(contextKey);
      await stores.plugin.set(contextKey, value);
      if (previous !== void 0 && previous.projectKey !== value.projectKey) {
        const previousIndexKey = jiraKeys.projectKeyIndex(previous.projectKey);
        const previousIndex = await stores.plugin.get(previousIndexKey);
        if (previousIndex !== void 0) {
          const remainingSites = previousIndex.sites.filter(
            (site2) => site2.cloudId !== value.cloudId || site2.projectId !== value.projectId
          );
          if (remainingSites.length === 0) {
            await stores.plugin.delete(previousIndexKey);
          } else {
            await stores.plugin.set(previousIndexKey, { sites: remainingSites });
          }
        }
      }
      const indexKey = jiraKeys.projectKeyIndex(value.projectKey);
      const existing = await stores.plugin.get(indexKey);
      const site = toCloudSite(value);
      const sites = [
        ...(existing?.sites ?? []).filter(
          (candidate) => candidate.cloudId !== value.cloudId || candidate.projectId !== value.projectId
        ),
        site
      ];
      await stores.plugin.set(indexKey, { sites });
    },
    getCloudSites: (projectKey) => getCloudSites(stores.plugin, projectKey),
    getCloudSite: async (projectKey) => {
      const sites = await getCloudSites(stores.plugin, projectKey);
      return sites.length === 1 ? sites[0] : void 0;
    },
    getWorkItem: (scope, cloudId, issueKey) => stores[scope].get(jiraKeys.workItem(cloudId, issueKey)),
    setWorkItem: (scope, value) => stores[scope].set(jiraKeys.workItem(value.cloudId, value.key), value),
    patchWorkItem: async (scope, patch) => {
      const store = stores[scope];
      const key = jiraKeys.workItem(patch.cloudId, patch.key);
      const existing = await store.get(key);
      const value = mergeWorkItem(existing, patch);
      await store.set(key, value);
      return value;
    }
  };
}
async function getCloudSites(store, projectKey) {
  const index = await store.get(jiraKeys.projectKeyIndex(projectKey));
  return index?.sites ?? [];
}
function mergeWorkItem(existing, patch) {
  const merged = { ...existing ?? {} };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== void 0) {
      merged[key] = value;
    }
  }
  return merged;
}
function toCloudSite(value) {
  return {
    cloudId: value.cloudId,
    projectId: value.projectId,
    projectKey: value.projectKey,
    tenantName: value.tenantName,
    siteUrl: value.siteUrl
  };
}
function encodeJiraProjectContext(value) {
  return {
    cloudId: value.cloudId,
    projectId: value.projectId,
    projectKey: value.projectKey,
    projectName: value.projectName,
    tenantName: value.tenantName,
    siteUrl: value.siteUrl,
    lastSeenAt: value.lastSeenAt
  };
}
function encodeJiraProjectKeyIndex(value) {
  return { sites: value.sites.map(encodeJiraCloudSite) };
}
function encodeJiraCloudSite(value) {
  return {
    cloudId: value.cloudId,
    projectId: value.projectId,
    projectKey: value.projectKey,
    tenantName: value.tenantName,
    siteUrl: value.siteUrl
  };
}
var KNOWN_WORK_ITEM_KEYS = /* @__PURE__ */ new Set([
  "cloudId",
  "key",
  "summary",
  "status",
  "issuetype",
  "priority",
  "resolution",
  "assignee",
  "reporter",
  "parent",
  "labels",
  "components",
  "fixVersions",
  "duedate",
  "created",
  "updated",
  "description",
  "remoteLinks",
  "issuelinks",
  "comment",
  "comments",
  "site",
  "_truncated"
]);
function encodeJiraWorkItem(value) {
  const encoded = {
    cloudId: value.cloudId,
    key: value.key,
    summary: value.summary,
    status: encodeStatus(value.status),
    issuetype: encodeNamedEntity(value.issuetype)
  };
  if (value.priority !== void 0) encoded.priority = encodeNamedEntity(value.priority);
  if (value.resolution !== void 0) {
    encoded.resolution = value.resolution === null ? null : encodeNamedEntity(value.resolution);
  }
  if (value.assignee !== void 0) {
    encoded.assignee = value.assignee === null ? null : encodeJiraUser(value.assignee);
  }
  if (value.reporter !== void 0) encoded.reporter = encodeJiraUser(value.reporter);
  if (value.parent !== void 0) {
    encoded.parent = {
      key: value.parent.key,
      ...value.parent.summary !== void 0 ? { summary: value.parent.summary } : {}
    };
  }
  if (value.labels !== void 0) encoded.labels = [...value.labels];
  if (value.components !== void 0) encoded.components = value.components.map(encodeNamedEntity);
  if (value.fixVersions !== void 0) {
    encoded.fixVersions = value.fixVersions.map(encodeNamedEntity);
  }
  if (value.duedate !== void 0) encoded.duedate = value.duedate;
  if (value.created !== void 0) encoded.created = value.created;
  if (value.updated !== void 0) encoded.updated = value.updated;
  if (value.description !== void 0) encoded.description = encodeDescription(value.description);
  if (value.remoteLinks !== void 0) encoded.remoteLinks = [...value.remoteLinks];
  if (value.issuelinks !== void 0) encoded.issuelinks = [...value.issuelinks];
  if (value.comment !== void 0) encoded.comment = encodeCommentBlock(value.comment);
  if (value.comments !== void 0) encoded.comments = value.comments.map(encodeComment);
  if (value.site !== void 0) encoded.site = value.site;
  if (value._truncated !== void 0) encoded._truncated = value._truncated;
  for (const [key, raw] of Object.entries(value)) {
    if (!KNOWN_WORK_ITEM_KEYS.has(key) && isJsonValue(raw)) {
      encoded[key] = raw;
    }
  }
  return encoded;
}
function encodeNamedEntity(value) {
  return { name: value.name };
}
function encodeStatus(value) {
  return {
    name: value.name,
    ...value.statusCategory !== void 0 ? { statusCategory: encodeStatusCategory(value.statusCategory) } : {}
  };
}
function encodeStatusCategory(value) {
  return { key: value.key, ...value.name !== void 0 ? { name: value.name } : {} };
}
function encodeJiraUser(value) {
  return {
    displayName: value.displayName,
    ...value.emailAddress !== void 0 ? { emailAddress: value.emailAddress } : {},
    ...value.active !== void 0 ? { active: value.active } : {}
  };
}
function encodeDescription(value) {
  return value;
}
function encodeCommentBlock(value) {
  return {
    ...value.comments !== void 0 ? { comments: value.comments.map(encodeComment) } : {},
    ...value.total !== void 0 ? { total: value.total } : {},
    ...value.maxResults !== void 0 ? { maxResults: value.maxResults } : {},
    ...value.startAt !== void 0 ? { startAt: value.startAt } : {}
  };
}
function encodeComment(value) {
  return {
    ...value.author !== void 0 ? { author: encodeJiraUser(value.author) } : {},
    ...value.updateAuthor !== void 0 ? { updateAuthor: encodeJiraUser(value.updateAuthor) } : {},
    ...value.body !== void 0 ? { body: value.body } : {},
    ...value.created !== void 0 ? { created: value.created } : {},
    ...value.updated !== void 0 ? { updated: value.updated } : {}
  };
}
function decodeJiraProjectContext(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const cloudId = stringProperty(value, "cloudId");
  const projectId = stringProperty(value, "projectId");
  const projectKey = stringProperty(value, "projectKey");
  const projectName = stringProperty(value, "projectName");
  const tenantName = stringProperty(value, "tenantName");
  const siteUrl = stringProperty(value, "siteUrl");
  const lastSeenAt = stringProperty(value, "lastSeenAt");
  if (cloudId === void 0 || projectId === void 0 || projectKey === void 0 || projectName === void 0 || tenantName === void 0 || siteUrl === void 0 || lastSeenAt === void 0) {
    return void 0;
  }
  try {
    return {
      cloudId: asCloudId(cloudId),
      projectId: asProjectId(projectId),
      projectKey: asProjectKey(projectKey),
      projectName,
      tenantName,
      siteUrl,
      lastSeenAt
    };
  } catch {
    return void 0;
  }
}
function decodeJiraProjectKeyIndex(value) {
  if (!isJsonObject(value) || !Array.isArray(value.sites)) {
    return void 0;
  }
  const sites = value.sites.flatMap((site) => {
    const decoded = decodeJiraCloudSite(site);
    return decoded === void 0 ? [] : [decoded];
  });
  return { sites };
}
function decodeJiraCloudSite(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const cloudId = stringProperty(value, "cloudId");
  const projectId = stringProperty(value, "projectId");
  const projectKey = stringProperty(value, "projectKey");
  const tenantName = stringProperty(value, "tenantName");
  const siteUrl = stringProperty(value, "siteUrl");
  if (cloudId === void 0 || projectId === void 0 || projectKey === void 0 || tenantName === void 0 || siteUrl === void 0) {
    return void 0;
  }
  try {
    return {
      cloudId: asCloudId(cloudId),
      projectId: asProjectId(projectId),
      projectKey: asProjectKey(projectKey),
      tenantName,
      siteUrl
    };
  } catch {
    return void 0;
  }
}
function decodeJiraWorkItem(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const cloudId = stringProperty(value, "cloudId");
  const key = stringProperty(value, "key");
  const summary = stringProperty(value, "summary");
  const status = decodeStatus(value.status);
  const issuetype = decodeNamedEntity(value.issuetype);
  if (cloudId === void 0 || key === void 0 || summary === void 0 || status === void 0 || issuetype === void 0) {
    return void 0;
  }
  const decoded = {};
  for (const [propertyKey, raw] of Object.entries(value)) {
    if (!KNOWN_WORK_ITEM_KEYS.has(propertyKey)) {
      decoded[propertyKey] = raw;
    }
  }
  const priority = decodeOptionalNamedEntity(value.priority);
  const resolution = decodeNullableNamedEntity(value.resolution);
  const assignee = decodeNullableUser(value.assignee);
  const reporter = value.reporter !== void 0 ? decodeNamedUser(value.reporter) : void 0;
  const parent = decodeParent(value.parent);
  const labels = decodeStringArray(value.labels);
  const components = decodeNamedEntityArray(value.components);
  const fixVersions = decodeNamedEntityArray(value.fixVersions);
  const duedate = value.duedate === null ? null : stringProperty(value, "duedate");
  const created = stringProperty(value, "created");
  const updated = stringProperty(value, "updated");
  const description = decodeDescription(value.description);
  const remoteLinks = Array.isArray(value.remoteLinks) ? [...value.remoteLinks] : void 0;
  const issuelinks = Array.isArray(value.issuelinks) ? [...value.issuelinks] : void 0;
  const comment = decodeCommentBlock(value.comment);
  const comments = decodeCommentArray(value.comments);
  const site = value.site === null ? null : stringProperty(value, "site");
  const _truncated = stringProperty(value, "_truncated");
  if (value.priority !== void 0 && priority === void 0 || value.resolution !== void 0 && value.resolution !== null && resolution === void 0 || value.assignee !== void 0 && value.assignee !== null && assignee === void 0 || value.reporter !== void 0 && reporter === void 0 || value.parent !== void 0 && parent === void 0 || value.labels !== void 0 && labels === void 0 || value.components !== void 0 && components === void 0 || value.fixVersions !== void 0 && fixVersions === void 0 || value.duedate !== void 0 && value.duedate !== null && duedate === void 0 || value.created !== void 0 && created === void 0 || value.updated !== void 0 && updated === void 0 || value.description !== void 0 && value.description !== null && description === void 0 || value.remoteLinks !== void 0 && remoteLinks === void 0 || value.issuelinks !== void 0 && issuelinks === void 0 || value.comment !== void 0 && comment === void 0 || value.comments !== void 0 && comments === void 0 || value.site !== void 0 && value.site !== null && site === void 0 || value._truncated !== void 0 && _truncated === void 0) {
    return void 0;
  }
  try {
    return {
      ...decoded,
      cloudId: asCloudId(cloudId),
      key: asIssueKey(key),
      summary,
      status,
      issuetype,
      ...priority !== void 0 ? { priority } : {},
      ...value.resolution !== void 0 ? { resolution } : {},
      ...value.assignee !== void 0 ? { assignee } : {},
      ...reporter !== void 0 ? { reporter } : {},
      ...parent !== void 0 ? { parent } : {},
      ...labels !== void 0 ? { labels } : {},
      ...components !== void 0 ? { components } : {},
      ...fixVersions !== void 0 ? { fixVersions } : {},
      ...value.duedate !== void 0 ? { duedate } : {},
      ...created !== void 0 ? { created } : {},
      ...updated !== void 0 ? { updated } : {},
      ...value.description !== void 0 ? { description } : {},
      ...remoteLinks !== void 0 ? { remoteLinks } : {},
      ...issuelinks !== void 0 ? { issuelinks } : {},
      ...comment !== void 0 ? { comment } : {},
      ...comments !== void 0 ? { comments } : {},
      ...value.site !== void 0 ? { site } : {},
      ..._truncated !== void 0 ? { _truncated } : {}
    };
  } catch {
    return void 0;
  }
}
function decodeNamedEntity(value) {
  if (value === void 0 || !isJsonObject(value)) {
    return void 0;
  }
  const name = stringProperty(value, "name");
  return name === void 0 ? void 0 : { name };
}
function decodeStatus(value) {
  if (value === void 0 || !isJsonObject(value)) {
    return void 0;
  }
  const name = stringProperty(value, "name");
  if (name === void 0) {
    return void 0;
  }
  const statusCategory = decodeStatusCategory(value.statusCategory);
  if (value.statusCategory !== void 0 && statusCategory === void 0) {
    return void 0;
  }
  return { name, ...statusCategory !== void 0 ? { statusCategory } : {} };
}
function decodeStatusCategory(value) {
  if (value === void 0 || !isJsonObject(value)) {
    return void 0;
  }
  const key = stringProperty(value, "key");
  if (key === void 0) {
    return void 0;
  }
  const name = stringProperty(value, "name");
  return { key, ...name !== void 0 ? { name } : {} };
}
function decodeOptionalNamedEntity(value) {
  return value === void 0 ? void 0 : decodeNamedEntity(value);
}
function decodeNullableNamedEntity(value) {
  if (value === null) {
    return null;
  }
  return decodeOptionalNamedEntity(value);
}
function decodeNamedUser(value) {
  if (value === void 0 || !isJsonObject(value)) {
    return void 0;
  }
  const displayName = stringProperty(value, "displayName");
  if (displayName === void 0) {
    return void 0;
  }
  const emailAddress = stringProperty(value, "emailAddress");
  const active = typeof value.active === "boolean" ? value.active : void 0;
  return {
    displayName,
    ...emailAddress !== void 0 ? { emailAddress } : {},
    ...active !== void 0 ? { active } : {}
  };
}
function decodeNullableUser(value) {
  if (value === null) {
    return null;
  }
  if (value === void 0) {
    return void 0;
  }
  return decodeNamedUser(value);
}
function decodeParent(value) {
  if (value === void 0 || !isJsonObject(value)) {
    return void 0;
  }
  const key = stringProperty(value, "key");
  if (key === void 0) {
    return void 0;
  }
  const summary = stringProperty(value, "summary");
  return { key, ...summary !== void 0 ? { summary } : {} };
}
function decodeStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : void 0;
}
function decodeNamedEntityArray(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const decoded = value.flatMap((item) => {
    const entity = decodeNamedEntity(item);
    return entity === void 0 ? [] : [entity];
  });
  return decoded.length === value.length ? decoded : void 0;
}
function decodeDescription(value) {
  return value === void 0 || value === null || typeof value === "string" ? value : void 0;
}
function decodeCommentBlock(value) {
  if (value === void 0) {
    return void 0;
  }
  if (!isJsonObject(value)) {
    return void 0;
  }
  const comments = decodeCommentArray(value.comments);
  const total = typeof value.total === "number" ? value.total : void 0;
  const maxResults = typeof value.maxResults === "number" ? value.maxResults : void 0;
  const startAt = typeof value.startAt === "number" ? value.startAt : void 0;
  if (value.comments !== void 0 && comments === void 0 || value.total !== void 0 && total === void 0 || value.maxResults !== void 0 && maxResults === void 0 || value.startAt !== void 0 && startAt === void 0) {
    return void 0;
  }
  return {
    ...comments !== void 0 ? { comments } : {},
    ...total !== void 0 ? { total } : {},
    ...maxResults !== void 0 ? { maxResults } : {},
    ...startAt !== void 0 ? { startAt } : {}
  };
}
function decodeCommentArray(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const decoded = value.flatMap((item) => {
    const comment = decodeComment(item);
    return comment === void 0 ? [] : [comment];
  });
  return decoded.length === value.length ? decoded : void 0;
}
function decodeComment(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const author = value.author !== void 0 ? decodeNamedUser(value.author) : void 0;
  const updateAuthor = value.updateAuthor !== void 0 ? decodeNamedUser(value.updateAuthor) : void 0;
  const body = typeof value.body === "string" ? value.body : void 0;
  const created = stringProperty(value, "created");
  const updated = stringProperty(value, "updated");
  if (value.author !== void 0 && author === void 0 || value.updateAuthor !== void 0 && updateAuthor === void 0 || value.body !== void 0 && body === void 0 || value.created !== void 0 && created === void 0 || value.updated !== void 0 && updated === void 0) {
    return void 0;
  }
  return {
    ...author !== void 0 ? { author } : {},
    ...updateAuthor !== void 0 ? { updateAuthor } : {},
    ...body !== void 0 ? { body } : {},
    ...created !== void 0 ? { created } : {},
    ...updated !== void 0 ? { updated } : {}
  };
}

// ../../plugins/jira/src/signals/link-prompt.ts
var PROMPT_CLAIM_MARKER = "prompt-link-shown";
async function isSessionLinked(store) {
  const keys = await store.keys();
  return keys.some((key) => parseWorkItemKeyName(key) !== void 0);
}
async function wasLinkPromptShown(store) {
  try {
    return await hasMarker(store, PROMPT_CLAIM_MARKER);
  } catch {
    return false;
  }
}
function claimPromptMarker(store) {
  return claimMarker(store, PROMPT_CLAIM_MARKER);
}
function buildPromptOutput(suggestion) {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: suggestion }
  });
}
async function runPromptLoop(store, suggestion) {
  if (await isSessionLinked(store)) {
    return void 0;
  }
  if (!await claimPromptMarker(store)) {
    return void 0;
  }
  return buildPromptOutput(suggestion);
}
function buildLinkSuggestion(lead) {
  return `${lead} Ask the developer \u2014 as its own explicit question, not merged with anything else \u2014 whether to link an existing work item, create a new one, or skip. Then act on the answer:
- Link existing: run \`work-item get --key <KEY> --scope session\` (the jira plugin CLI) for the chosen key. That stores the work item in this session, which links the session to it and emits the link signal. It links the SESSION to the work item \u2014 do NOT create any Jira issue link or attach a pull request to the ticket.
- Create new: run the create-work-item flow; its \`work-item create\` stores the new item in this session, which links the session to it.
- Skip: do nothing. Ask at most once per session; if they skip, do not ask again.`;
}
var LEADS = {
  branch: "A new git branch was just created, but this session has no Jira work item linked.",
  push: "A branch was just pushed for the first time, but this session has no Jira work item linked.",
  commit: "A commit was just made, but this session has no Jira work item linked.",
  pr: "A pull request was just created, but this session has no Jira work item linked."
};
function readBashCall(payload) {
  if (payload === void 0 || !isJsonObject(payload) || payload.tool_name !== "Bash") {
    return void 0;
  }
  const input = payload.tool_input;
  const response = payload.tool_response;
  const command = isJsonObject(input) && typeof input.command === "string" ? input.command : "";
  const stdout = isJsonObject(response) && typeof response.stdout === "string" ? response.stdout : "";
  const stderr = isJsonObject(response) && typeof response.stderr === "string" ? response.stderr : "";
  return { command, output: [stdout, stderr].filter((s) => s.length > 0).join("\n") };
}
function branchCreateName(command) {
  const match = command.match(
    /\bgit\b[^|&;]*?\b(?:checkout|switch)\b[^|&;]*?\s(?:--create|-[a-zA-Z]*[bBcC])\s+("?)([^\s"]+)\1/
  );
  return match ? match[2] : void 0;
}
function isGitPush(command) {
  if (!/\bgit\b[^|&;]*?\bpush\b/.test(command)) return false;
  return !/(^|\s)(--help|-h|--dry-run|-n)(\s|$)/.test(command);
}
function isFirstPush(command, output) {
  if (/\[new branch\]/.test(output)) return true;
  const setsUpstream = /(^|\s)(-u|--set-upstream)(\s|=|$)/.test(command);
  return setsUpstream && output.trim() === "";
}
function isGitCommit(command) {
  if (!/\bgit\b[^|&;]*?\bcommit\b/.test(command)) return false;
  return !/(^|\s)(--help|-h|--dry-run)(\s|$)/.test(command);
}
function isPrCreate(command) {
  const twg = /twg\s+(bitbucket|bb)\s+(pull-requests?|prs?)\s+create\b/.test(command);
  const gh = /\bgh\s+pr\s+create\b/.test(command);
  if (!twg && !gh) return false;
  if (/(^|\s)(--help|-h)(\s|$)/.test(command)) return false;
  if (gh && /(^|\s)--dry-run(\s|$)/.test(command)) return false;
  return true;
}
var FAILURE = /\bexit=[1-9]/;
var LEADING_ERROR = /^(error|fatal)\b[:\s]/im;
function looksLikeFailure(output) {
  return FAILURE.test(output) || LEADING_ERROR.test(output);
}
function looksLikePushFailure(output) {
  return looksLikeFailure(output) || /!\s*\[rejected\]|failed to push/i.test(output);
}
function looksLikeNoCommit(output) {
  return /nothing to commit/i.test(output) || looksLikeFailure(output);
}
function detectBashTouchpoint(call) {
  const branch = branchCreateName(call.command);
  if (branch !== void 0 && extractFirstIssueKey(branch) === void 0 && !looksLikeFailure(call.output)) {
    return "branch";
  }
  if (isPrCreate(call.command) && !looksLikeFailure(call.output)) {
    return "pr";
  }
  if (isGitPush(call.command) && !looksLikePushFailure(call.output) && isFirstPush(call.command, call.output)) {
    return "push";
  }
  if (isGitCommit(call.command) && !looksLikeNoCommit(call.output)) {
    return "commit";
  }
  return void 0;
}

// ../../plugins/jira/src/bin/plugin-version.ts
import { readFileSync } from "node:fs";
import path5 from "node:path";
import { fileURLToPath } from "node:url";
var UNKNOWN_VERSION = "unknown";
function readPluginVersion(entryUrl) {
  const manifestPath = path5.join(pluginRootOf(entryUrl), ".claude-plugin", "plugin.json");
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return typeof manifest.version === "string" ? manifest.version : UNKNOWN_VERSION;
  } catch {
    return UNKNOWN_VERSION;
  }
}
function pluginRootOf(entryUrl) {
  return path5.resolve(path5.dirname(fileURLToPath(entryUrl)), "..");
}

// ../../plugins/jira/src/signals/session-analytics.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { platform as osPlatform } from "node:os";

// ../../packages/twg-run/src/index.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { accessSync as accessSync2, constants as constants2, existsSync, mkdtempSync, readFileSync as readFileSync2, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter as delimiter2, join as join3 } from "node:path";
function resolveOnPath2(command, env) {
  if (command.includes("/")) return command;
  for (const dir of (env.PATH ?? "").split(delimiter2)) {
    if (dir === "") continue;
    const candidate = join3(dir, command);
    try {
      accessSync2(candidate, constants2.X_OK);
      return candidate;
    } catch {
    }
  }
  return command;
}
var TwgNotFoundError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TwgNotFoundError";
  }
};
function resolveTwgBinary(env = process.env) {
  if (env.TWG_BIN) {
    if (existsSync(env.TWG_BIN)) {
      return env.TWG_BIN;
    }
    throw new TwgNotFoundError(`twg binary not found at TWG_BIN=${env.TWG_BIN}`);
  }
  const candidates = [];
  if (env.HOME) {
    candidates.push(join3(env.HOME, ".local", "bin", "twg"));
  }
  if (env.LOCALAPPDATA) {
    candidates.push(join3(env.LOCALAPPDATA, "Programs", "twg", "bin", "twg.exe"));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return resolveOnPath2("twg", env);
}
function runTwgJson(binary, args, options = {}) {
  if (options.passthroughArgs) {
    return runTwgPassthrough(binary, args, options);
  }
  let dir;
  try {
    dir = mkdtempSync(join3(tmpdir(), "twg-run-"));
  } catch {
    dir = void 0;
  }
  const outFile = dir ? join3(dir, "payload.json") : void 0;
  try {
    const result = spawnSync2(
      binary,
      [
        ...args,
        ...options.site ? ["--site", options.site] : [],
        "--output",
        "json",
        ...outFile ? ["--output-file", outFile] : [],
        "--mode",
        "user"
      ],
      {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        ...options.input !== void 0 ? { input: options.input } : {},
        ...options.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {}
      }
    );
    if (result.error) {
      if (result.error.code === "ENOENT") {
        throw new TwgNotFoundError(`twg binary not found on PATH: ${binary}`);
      }
      if (result.error.code === "ETIMEDOUT") {
        return {
          ok: false,
          status: result.status ?? null,
          timedOut: true,
          detail: `twg timed out after ${options.timeoutMs ?? 0}ms`
        };
      }
      throw result.error;
    }
    let raw;
    if (outFile) {
      try {
        raw = readFileSync2(outFile, "utf8");
      } catch {
        raw = void 0;
      }
    }
    if (!raw) {
      raw = String(result.stdout ?? "");
    }
    const parsed = parseTwgPayload(raw);
    const payloadError = result.status === 0 && parsed.parseError !== void 0 ? parsed.parseError : payloadErrorDetail(parsed.payload);
    if (result.status !== 0 || payloadError !== void 0) {
      return {
        ok: false,
        status: result.status,
        detail: payloadError ?? firstLine(result.stderr) ?? `twg exited with status ${result.status}`,
        ...result.status === 0 && parsed.parseError !== void 0 ? { malformed: true } : {},
        ...payloadErrorFields(parsed.payload)
      };
    }
    return { ok: true, payload: parsed.payload };
  } finally {
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
      }
    }
  }
}
function extractArrayPayload(payload, fallbackKeys = []) {
  if (payload === void 0) {
    return void 0;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isJsonObject(payload)) {
    return void 0;
  }
  const data = payload.data;
  if (Array.isArray(data)) {
    return data;
  }
  for (const key of fallbackKeys) {
    if (isJsonObject(data) && Array.isArray(data[key])) {
      return data[key];
    }
  }
  for (const key of fallbackKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  return void 0;
}
function runTwgPassthrough(binary, args, options) {
  const result = spawnSync2(binary, [...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options.input !== void 0 ? { input: options.input } : {},
    ...options.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {}
  });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new TwgNotFoundError(`twg binary not found on PATH: ${binary}`);
    }
    if (result.error.code === "ETIMEDOUT") {
      return {
        ok: false,
        status: result.status ?? null,
        timedOut: true,
        detail: `twg timed out after ${options.timeoutMs ?? 0}ms`
      };
    }
    throw result.error;
  }
  if (result.status === 0) {
    const detail = fullOutput(result.stdout);
    return detail !== void 0 ? { ok: true, detail } : { ok: true };
  }
  const failureOutput = [fullOutput(result.stdout), fullOutput(result.stderr)].filter((text6) => text6 !== void 0).join("\n");
  return {
    ok: false,
    status: result.status,
    detail: failureOutput.length > 0 ? failureOutput : `twg exited with status ${result.status}`
  };
}
function fullOutput(text6) {
  const trimmed = String(text6 ?? "").trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function parseTwgPayload(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || trimmed === "null") {
    return {};
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { parseError: `twg did not return JSON (${reason}): ${firstLine(trimmed) ?? ""}` };
  }
  return isJsonValue(parsed) ? { payload: parsed } : {};
}
function payloadErrorDetail(payload) {
  if (payload === void 0 || !isJsonObject(payload) || payload.ok !== false) {
    return void 0;
  }
  const error = payload.error;
  if (isJsonObject(error)) {
    const summary = error.summary ?? error.message ?? error.code;
    if (typeof summary === "string") {
      return summary;
    }
  }
  return "twg reported a failure";
}
function payloadErrorFields(payload) {
  if (payload === void 0 || !isJsonObject(payload) || !isJsonObject(payload.error)) return {};
  const { code, details } = payload.error;
  const reason = isJsonObject(details) ? details.reason : void 0;
  return {
    ...typeof code === "string" ? { errorCode: code } : {},
    ...typeof reason === "string" ? { errorReason: reason } : {}
  };
}
function firstLine(text6) {
  return String(text6 ?? "").split("\n").map((line) => line.trim()).find((line) => line.length > 0);
}

// ../../plugins/jira/src/signals/jira-launch.ts
var JIRA_WORK_ITEM_TAG = "<JIRA_WORK_ITEM>";
var JIRA_LAUNCH_MARKER = "jira-agent-session-launch";
var FIRST_PROMPT_MARKER = "jira-launch-first-prompt";
function inspectPrompt(payload) {
  const text6 = payload !== void 0 && isJsonObject(payload) ? payload.prompt : void 0;
  return typeof text6 === "string" ? { present: true, tagged: text6.includes(JIRA_WORK_ITEM_TAG) } : { present: false, tagged: false };
}
async function recordJiraLaunch(sessionStore, payload) {
  try {
    const prompt = inspectPrompt(payload);
    if (!prompt.present || !await claimMarker(sessionStore, FIRST_PROMPT_MARKER)) {
      return false;
    }
    if (!prompt.tagged) {
      return false;
    }
    await claimMarker(sessionStore, JIRA_LAUNCH_MARKER);
    return true;
  } catch {
    return false;
  }
}
async function wasJiraLaunched(sessionStore) {
  try {
    return await hasMarker(sessionStore, JIRA_LAUNCH_MARKER);
  } catch {
    return false;
  }
}

// ../../plugins/jira/src/signals/session-signal.ts
var OPERATION_TYPES = { start: "session_start", end: "session_end" };
function resolveAgentName(env) {
  if (env.CODEX_SESSION_ID || env.PLUGIN_ROOT) {
    return "codex";
  }
  if (env.CLAUDE_CODE_SESSION_ID) {
    return "claude-code";
  }
  return "unknown";
}
function buildLocalSessionPayload(operation, issueKey, context) {
  return {
    agentId: context.agentSessionId,
    agentName: context.agentName,
    workingDirectory: context.workingDirectory,
    ...context.tenantId !== void 0 ? { cloudId: context.tenantId } : {},
    workItemKey: issueKey ?? null,
    operationType: OPERATION_TYPES[operation]
  };
}
function emitLocalSession(operation, options) {
  const env = options.env ?? process.env;
  try {
    const runner = options.runner ?? runTwgJson;
    const binary = resolveTwgBinary(env);
    const post = options.post ?? ((agentSessionId, payload2) => postViaTwgLocalSession(binary, agentSessionId, payload2, runner, env));
    const tenantId = options.tenantId ?? resolveDefaultTenantId(binary, runner, env);
    const payload = buildLocalSessionPayload(operation, options.issueKey ?? null, {
      agentSessionId: options.agentSessionId,
      agentName: resolveAgentName(env),
      workingDirectory: options.workingDirectory,
      tenantId
    });
    if (!options.agentSessionId || payload.cloudId === void 0) {
      logSignalEvent(
        "local-session-skipped",
        {
          operation,
          workItemKey: payload.workItemKey,
          hasAgentSessionId: Boolean(options.agentSessionId),
          hasCloudId: payload.cloudId !== void 0
        },
        { env }
      );
      return false;
    }
    const posted = post(options.agentSessionId, payload);
    logSignalEvent(
      "local-session",
      { operation, workItemKey: payload.workItemKey, cloudId: payload.cloudId ?? null, posted },
      { env }
    );
    return posted;
  } catch (error) {
    logSignalEvent(
      "local-session-error",
      {
        operation,
        workItemKey: options.issueKey ?? null,
        message: error instanceof Error ? error.message : String(error)
      },
      { env }
    );
    return false;
  }
}
function resolveDefaultTenantId(binary, runner = runTwgJson, env = process.env) {
  const result = runner(binary, ["access"]);
  if (!result.ok || result.payload === void 0 || !isJsonObject(result.payload)) {
    return void 0;
  }
  const data = result.payload.data;
  const products = data !== void 0 && isJsonObject(data) ? data.products : void 0;
  if (!Array.isArray(products)) {
    return void 0;
  }
  const sites = [];
  for (const product of products) {
    if (!isJsonObject(product) || !String(product.productId ?? "").startsWith("jira")) {
      continue;
    }
    for (const site of Array.isArray(product.sites) ? product.sites : []) {
      if (isJsonObject(site) && typeof site.name === "string" && typeof site.cloudId === "string") {
        sites.push({ name: site.name, cloudId: site.cloudId });
      }
    }
  }
  if (sites.length === 0) {
    return void 0;
  }
  sites.sort((a, b) => a.name.localeCompare(b.name));
  const preferred = env.TWG_SITE;
  const match = preferred !== void 0 ? sites.find((site) => site.name === preferred) : void 0;
  return (match ?? sites[0]).cloudId;
}
function diagnosticFailureDetail(detail) {
  if (detail === void 0) {
    return null;
  }
  const lines = detail.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const candidate of [detail, ...lines]) {
    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }
    if (!isJsonValue(parsed) || !isJsonObject(parsed) || !isJsonObject(parsed.error)) continue;
    const { code, message, details } = parsed.error;
    const kept = {};
    if (typeof code === "string") kept.code = code;
    if (typeof message === "string") kept.message = message;
    if (typeof details === "string" || typeof details === "number") kept.details = details;
    return Object.keys(kept).length > 0 ? kept : null;
  }
  const firstLine5 = lines[0];
  return firstLine5 !== void 0 && !/^[{["]/.test(firstLine5) ? firstLine5 : null;
}
function postViaTwgLocalSession(binary, agentSessionId, payload, runner, env) {
  const result = runner(
    binary,
    ["integrations", "local-session", "update", agentSessionId, "--input", "-", "--include"],
    { input: JSON.stringify(payload), timeoutMs: 8e3, passthroughArgs: true }
  );
  logSignalEvent(
    "local-session-update-result",
    {
      workItemKey: payload.workItemKey,
      operationType: payload.operationType,
      ok: result.ok,
      status: result.status ?? null,
      detail: result.ok ? null : diagnosticFailureDetail(result.detail)
    },
    { env }
  );
  return result.ok;
}

// ../../plugins/jira/src/signals/analytics-queue.ts
import { randomUUID as randomUUID2 } from "node:crypto";
var MAX_QUEUED = 200;
var MAX_AGE_MS = 7 * 24 * 60 * 60 * 1e3;
var MAX_ATTEMPTS = 8;
var MAX_SENDS_PER_DRAIN = 50;
var BASE_BACKOFF_MS = 60 * 1e3;
var MAX_BACKOFF_MS = 6 * 60 * 60 * 1e3;
var DRAIN_BUDGET_MS = 6 * 1e3;
var LEASE_MS = 5 * 60 * 1e3;
var ENTRY_PREFIX = "jira/analytics/queue/";
var entryCodec = {
  version: 1,
  encode: (value) => ({ ...value }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const { eventName, body, queuedAt, attempts, nextAttemptAt } = value;
    return typeof eventName === "string" && typeof body === "string" && typeof queuedAt === "number" && typeof attempts === "number" && typeof nextAttemptAt === "number" ? { eventName, body, queuedAt, attempts, nextAttemptAt } : void 0;
  }
};
var leaseKey = defineStorageKey("jira/analytics/queue-lease", {
  version: 1,
  encode: (value) => ({ acquiredAt: value.acquiredAt }),
  decode: (value) => isJsonObject(value) && typeof value.acquiredAt === "number" ? { acquiredAt: value.acquiredAt } : void 0
});
function entryKey(name) {
  return defineStorageKey(name, entryCodec);
}
function newEntryName(queuedAt) {
  return `${ENTRY_PREFIX}${String(queuedAt).padStart(15, "0")}-${randomUUID2()}`;
}
function createAnalyticsQueue(store, options = {}) {
  const list = async () => {
    const names = (await store.keys()).filter((name) => name.startsWith(ENTRY_PREFIX)).sort();
    const entries = [];
    for (const name of names) {
      const entry = await store.get(entryKey(name));
      if (entry !== void 0) entries.push({ ...entry, name });
    }
    return entries;
  };
  return {
    list,
    enqueue: async (eventName, body, now = Date.now()) => {
      await store.set(entryKey(newEntryName(now)), {
        eventName,
        body,
        queuedAt: now,
        attempts: 0,
        nextAttemptAt: now
      });
      const names = (await store.keys()).filter((name) => name.startsWith(ENTRY_PREFIX)).sort();
      const excess = names.length - MAX_QUEUED;
      for (const name of names.slice(0, Math.max(0, excess))) {
        await store.delete(entryKey(name));
      }
      if (excess > 0) {
        logSignalEvent(
          "analytics-queue-evicted",
          { evicted: excess },
          { env: options.env, write: options.logWrite }
        );
      }
    }
  };
}
var NOTHING = { sent: 0, retried: 0, dropped: 0 };
async function drainAnalyticsQueue(options) {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const log = { env: options.env, write: options.logWrite };
  const store = options.store;
  try {
    if (!await acquireLease(store, now())) {
      return NOTHING;
    }
  } catch {
    return NOTHING;
  }
  let sent = 0;
  let retried = 0;
  let dropped = 0;
  try {
    const optedOut = (options.env ?? process.env).DO_NOT_TRACK === "1";
    const entries = await createAnalyticsQueue(store).list();
    const maxSends = options.maxSends ?? MAX_SENDS_PER_DRAIN;
    const deadline = now() + (options.budgetMs ?? DRAIN_BUDGET_MS);
    let posts = 0;
    for (const entry of entries) {
      const key = entryKey(entry.name);
      const at2 = now();
      if (optedOut || at2 - entry.queuedAt > MAX_AGE_MS) {
        await store.delete(key);
        dropped += 1;
        continue;
      }
      if (entry.nextAttemptAt > at2) continue;
      if (posts >= maxSends || at2 >= deadline) break;
      posts += 1;
      if (await options.post(restamp(entry.body, at2))) {
        await store.delete(key);
        sent += 1;
        continue;
      }
      const attempts = entry.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await store.delete(key);
        dropped += 1;
        continue;
      }
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
      await store.set(key, {
        eventName: entry.eventName,
        body: entry.body,
        queuedAt: entry.queuedAt,
        attempts,
        nextAttemptAt: at2 + Math.round(backoff * (0.5 + random()))
      });
      retried += 1;
    }
  } catch {
  } finally {
    await store.delete(leaseKey).catch(() => false);
  }
  if (sent + retried + dropped > 0) {
    logSignalEvent("analytics-queue-drained", { sent, retried, dropped }, log);
  }
  return { sent, retried, dropped };
}
async function acquireLease(store, at2) {
  if (await store.claim(leaseKey, { acquiredAt: at2 })) return true;
  const held = await store.get(leaseKey);
  if (held !== void 0 && at2 - held.acquiredAt <= LEASE_MS) return false;
  await store.delete(leaseKey);
  return store.claim(leaseKey, { acquiredAt: at2 });
}
function restamp(body, at2) {
  try {
    const parsed = JSON.parse(body);
    if (!isJsonObject(parsed)) return body;
    const sentAt = new Date(at2).toISOString();
    const value = parsed;
    value.sentAt = sentAt;
    for (const event of value.batch ?? []) event.sentAt = sentAt;
    return JSON.stringify(value);
  } catch {
    return body;
  }
}

// ../../plugins/jira/src/signals/session-analytics.ts
var GAS_ENDPOINT = "https://as.atlassian.com/api/v1/batch";
var PRODUCT_BY_AGENT = {
  codex: "atlassianCodexPlugin",
  "claude-code": "atlassianClaudePlugin",
  unknown: "atlassianClaudePlugin"
};
var PLATFORM_TAG = "atlassianAgentPlugins";
var ACTION_SUBJECT_ID = "client";
var AI_FEATURE_NAME = "localAgentSession";
var EXPERIENCE_ID = "local-agent-sessions";
var ORPHANED_SESSION = { linked: false };
async function readSessionLinkMetadata(sessionStore) {
  const trigger = await wasJiraLaunched(sessionStore) ? { sessionTrigger: "jiraLaunch" } : {};
  try {
    const recorded = await createJiraLinkSignalStore(sessionStore).listRecorded();
    if (recorded.length === 0) {
      return { ...ORPHANED_SESSION, ...trigger };
    }
    const latest = recorded.reduce((a, b) => b.recordedAt > a.recordedAt ? b : a);
    return {
      linked: true,
      ...latest.issueId !== void 0 ? { linkedIssueId: latest.issueId } : {},
      ...latest.projectId !== void 0 ? { linkedProjectId: latest.projectId } : {},
      ...trigger
    };
  } catch {
    return { ...ORPHANED_SESSION, ...trigger };
  }
}
function isAnalyticsDisabled(env = process.env) {
  return env.DO_NOT_TRACK === "1";
}
function mapPlatform(value = osPlatform()) {
  switch (value) {
    case "darwin":
      return "mac";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unknown";
  }
}
function numericId(value) {
  if (value === void 0 || !/^\d+$/.test(value)) {
    return void 0;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : void 0;
}
function nonEmpty2(value) {
  return typeof value === "string" && value.length > 0;
}
function sharedAttributes(fields) {
  const linkMetadata = fields.options.linkMetadata ?? ORPHANED_SESSION;
  const linkedJiraIssueId = numericId(linkMetadata.linkedIssueId);
  const linkedJiraProjectId = numericId(linkMetadata.linkedProjectId);
  const cliVersion = fields.metadata.cliVersion;
  return {
    sessionID: fields.agentSessionId,
    conversationId: fields.agentSessionId,
    singleInstrumentationID: randomUUID3(),
    aiFeatureName: AI_FEATURE_NAME,
    experienceID: EXPERIENCE_ID,
    hostPlatform: mapPlatform(fields.options.platform),
    pluginVersion: fields.options.pluginVersion ?? readPluginVersion(import.meta.url),
    ...cliVersion !== void 0 ? { cliVersion } : {},
    isAIFeature: 1,
    userGeneratedAI: 1,
    ...fields.metadata.userSegment !== void 0 ? { userSegment: fields.metadata.userSegment } : {},
    isOrphanedSession: linkMetadata.linked ? 0 : 1,
    ...linkedJiraIssueId !== void 0 ? { linkedJiraIssueId } : {},
    ...linkedJiraProjectId !== void 0 ? { linkedJiraProjectId } : {},
    ...linkMetadata.sessionTrigger !== void 0 ? { sessionTrigger: linkMetadata.sessionTrigger } : {}
  };
}
function buildTrackRequest(fields) {
  const timestamp2 = new Date(fields.occurredAt).toISOString();
  const userId = fields.metadata.userId;
  const hasUser = nonEmpty2(userId);
  const anonymousId = nonEmpty2(fields.metadata.hashedUserId) ? fields.metadata.hashedUserId : fields.agentSessionId;
  const hasTenant = nonEmpty2(fields.tenantId);
  const product = PRODUCT_BY_AGENT[resolveAgentName(fields.options.env ?? process.env)];
  const attributes = allowlisted(
    fields.eventName,
    { ...sharedAttributes(fields), ...fields.attributes },
    { env: fields.options.env }
  );
  const segmentEvent = {
    type: "track",
    event: fields.eventName,
    ...hasUser ? { userId } : { anonymousId },
    properties: {
      eventType: "track",
      product,
      source: product,
      tags: [PLATFORM_TAG],
      env: "prod",
      origin: "console",
      producerRole: "client",
      // GAS's own envelope platform is the OS, the same value as `attributes.hostPlatform`.
      platform: mapPlatform(fields.options.platform),
      ...hasUser ? { userIdType: "atlassianAccount" } : {},
      tenantIdType: hasTenant ? "cloudId" : "none",
      ...hasTenant ? { tenantId: fields.tenantId } : {},
      sessionId: fields.agentSessionId,
      actionSubject: fields.actionSubject,
      action: fields.action,
      actionSubjectId: ACTION_SUBJECT_ID,
      attributes
    },
    timestamp: timestamp2,
    sentAt: timestamp2,
    context: {}
  };
  return {
    url: GAS_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from("BLANK:").toString("base64")}`
    },
    body: JSON.stringify({ batch: [segmentEvent], writeKey: "BLANK", sentAt: timestamp2 }),
    timeoutMs: 3e3,
    eventName: fields.eventName,
    attributes
  };
}
function buildLinkAnalyticsRequest(input, metadata = {}, options = {}) {
  const linkMetadata = {
    ...options.linkMetadata,
    linked: true,
    ...input.issueId !== void 0 ? { linkedIssueId: input.issueId } : {},
    ...input.projectId !== void 0 ? { linkedProjectId: input.projectId } : {}
  };
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: options.now ?? Date.now(),
    metadata,
    tenantId: input.tenantId,
    eventName: "aiSession linked",
    actionSubject: "aiSession",
    action: "linked",
    attributes: {
      linkSource: input.linkSource ?? "unknown",
      ...input.linkPromptShown !== void 0 ? { linkPromptShown: input.linkPromptShown ? 1 : 0 } : {}
    },
    options: { ...options, linkMetadata }
  });
}
function buildInteractionAnalyticsRequest(input, metadata = {}, options = {}) {
  const startedAt = input.startedAt ?? options.now ?? Date.now();
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: startedAt,
    metadata,
    tenantId: metadata.tenantId,
    eventName: "aiInteraction initiated",
    actionSubject: "aiInteraction",
    action: "initiated",
    attributes: {
      proactiveGeneratedAI: 0,
      sessionStartedTimestamp: startedAt,
      ...input.sessionTrigger !== void 0 ? { sessionTrigger: input.sessionTrigger } : {}
    },
    options
  });
}
function buildSkillAnalyticsRequest(input, metadata = {}, options = {}) {
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: options.now ?? Date.now(),
    metadata,
    tenantId: metadata.tenantId,
    eventName: "aiSessionSkill accessed",
    actionSubject: "aiSessionSkill",
    action: "accessed",
    attributes: {
      skillName: input.invocation.skillName,
      skillInvocationSource: input.invocation.invocationSource
    },
    options
  });
}
function buildCommandAnalyticsRequest(input, metadata = {}, options = {}) {
  const memory = input.commandPath === "memory search" ? input : void 0;
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: input.occurredAt,
    metadata,
    tenantId: metadata.tenantId,
    eventName: "aiSessionCommand completed",
    actionSubject: "aiSessionCommand",
    action: "completed",
    attributes: {
      commandPath: input.commandPath,
      verdictStatus: input.verdictStatus,
      reasonCodes: [...input.reasonCodes],
      exitCode: input.exitCode,
      durationMs: input.durationMs,
      invokedBy: input.invokedBy,
      ...input.templateSource !== void 0 ? { templateSource: input.templateSource } : {},
      ...memory?.memoryResultCount !== void 0 ? { memoryResultCount: memory.memoryResultCount } : {},
      ...memory?.memoryFailureStage !== void 0 ? { memoryFailureStage: memory.memoryFailureStage } : {}
    },
    options
  });
}
function buildErrorAnalyticsRequest(input, metadata = {}, options = {}) {
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: input.occurredAt ?? options.now ?? Date.now(),
    metadata,
    tenantId: metadata.tenantId,
    eventName: "aiInteraction error",
    actionSubject: "aiInteraction",
    action: "error",
    attributes: {
      aiErrorCode: input.aiErrorCode,
      aiErrorMessage: input.aiErrorMessage,
      errorStage: input.errorStage,
      ...input.commandPath !== void 0 ? { commandPath: input.commandPath } : {}
    },
    options
  });
}
function buildAssetRetrievalAnalyticsRequest(input, metadata = {}, options = {}) {
  const objectId = numericId(input.issueId);
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: input.occurredAt,
    metadata,
    tenantId: metadata.tenantId,
    eventName: "asset retrieved",
    actionSubject: "asset",
    action: "retrieved",
    attributes: {
      retrievalMethod: "pluginCli",
      assetType: input.assetType,
      assetCount: input.assetCount,
      retrievedAssets: safeAssets(
        input.retrievedAssets ?? (objectId !== void 0 ? [{ objectType: input.assetType, objectId }] : [])
      ),
      retrievalSource: input.retrievalSource,
      ...input.siteSource !== void 0 ? { siteSource: input.siteSource } : {}
    },
    options
  });
}
function buildAdoptedAnalyticsRequest(input, metadata = {}, options = {}) {
  const jiraIssueId = numericId(input.jiraIssueId);
  return buildTrackRequest({
    agentSessionId: input.agentSessionId,
    occurredAt: input.occurredAt,
    metadata,
    tenantId: metadata.tenantId,
    eventName: "aiResult adopted",
    actionSubject: "aiResult",
    action: "adopted",
    attributes: {
      aiResultAction: input.aiResultAction,
      artefactsCreated: {
        ...jiraIssueId !== void 0 ? { jiraIssueId } : {},
        ...input.pullRequestResourceAri !== void 0 ? { pullRequestResourceAri: input.pullRequestResourceAri } : {},
        ...input.codeFilesCreated !== void 0 ? { codeFilesCreated: input.codeFilesCreated } : {}
      }
    },
    options
  });
}
function postQueuedBody(body, fetchImpl = globalThis.fetch) {
  return postAnalyticsEvent(
    {
      url: GAS_ENDPOINT,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from("BLANK:").toString("base64")}`
      },
      body,
      timeoutMs: 3e3,
      eventName: "",
      attributes: {}
    },
    fetchImpl
  );
}
async function postAnalyticsEvent(request, fetchImpl) {
  if (typeof fetchImpl !== "function") {
    return false;
  }
  try {
    const response = await fetchImpl(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(request.timeoutMs)
    });
    await response.text();
    return response.ok;
  } catch {
    return false;
  }
}
async function emit(build2, options) {
  try {
    const env = options.env ?? process.env;
    if (isAnalyticsDisabled(env)) {
      return false;
    }
    const metadata = (options.resolveMetadata ?? (() => resolveAnalyticsMetadata(env)))();
    const linkMetadata = options.linkMetadata ?? (options.sessionStore !== void 0 ? await readSessionLinkMetadata(options.sessionStore) : void 0);
    const request = build2(metadata, {
      now: options.now,
      platform: options.platform,
      env,
      ...linkMetadata !== void 0 ? { linkMetadata } : {}
    });
    const sent = await postAnalyticsEvent(request, options.fetchImpl ?? globalThis.fetch);
    if (!sent && options.queueStore !== void 0) {
      await createAnalyticsQueue(options.queueStore, { env, logWrite: options.logWrite }).enqueue(request.eventName, request.body).catch(() => void 0);
    }
    logSignalEvent(
      "analytics-event",
      {
        eventName: request.eventName,
        sessionID: stringOrUndefined(request.attributes.sessionID),
        attributes: JSON.parse(JSON.stringify(request.attributes)),
        sent
      },
      { env, write: options.logWrite }
    );
    return sent;
  } catch {
    return false;
  }
}
function stringOrUndefined(value) {
  return typeof value === "string" ? value : void 0;
}
function emitLinkAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildLinkAnalyticsRequest(input, metadata, opts), options);
}
function emitInteractionAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildInteractionAnalyticsRequest(input, metadata, opts), options);
}
function emitCommandAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildCommandAnalyticsRequest(input, metadata, opts), options);
}
function emitAssetRetrievalAnalytics(input, options = {}) {
  return emit(
    (metadata, opts) => buildAssetRetrievalAnalyticsRequest(input, metadata, opts),
    options
  );
}
function emitAdoptedAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildAdoptedAnalyticsRequest(input, metadata, opts), options);
}
function emitErrorAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildErrorAnalyticsRequest(input, metadata, opts), options);
}
function emitSkillAnalytics(input, options = {}) {
  return emit((metadata, opts) => buildSkillAnalyticsRequest(input, metadata, opts), options);
}
function resolveAnalyticsMetadata(env = process.env, runner = runTwgJson) {
  let binary;
  try {
    binary = resolveTwgBinary(env);
  } catch {
    return {};
  }
  return {
    ...safe(() => resolveUserIdentity(binary, runner)) ?? {},
    tenantId: safe(() => resolveDefaultTenantId(binary, runner, env)),
    cliVersion: safe(() => readCliVersion(binary, runner))
  };
}
function resolveUserIdentity(binary, runner) {
  const result = runner(binary, ["whoami"]);
  if (!result.ok || result.payload === void 0 || !isJsonObject(result.payload)) {
    return {};
  }
  const inner = result.payload.data;
  const record = Array.isArray(inner) ? inner[0] : inner;
  if (record === void 0 || !isJsonObject(record) || typeof record.accountId !== "string") {
    return {};
  }
  const userSegment = classifyUser(typeof record.email === "string" ? record.email : void 0);
  return userSegment === "internal" ? { userId: record.accountId, userSegment } : { hashedUserId: hashIdentifier(record.accountId), userSegment };
}
function safe(read) {
  try {
    return read();
  } catch {
    return void 0;
  }
}
function readCliVersion(binary, runner) {
  const result = runner(binary, ["--version"], { passthroughArgs: true, timeoutMs: 2e3 });
  if (!result.ok) {
    return void 0;
  }
  const match = /(?:^|\s)v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)(?=\s|$)/.exec(
    result.detail ?? ""
  );
  return match?.[1];
}

// ../../plugins/jira/src/storage/plugin-data.ts
import os3 from "node:os";
import path6 from "node:path";
var JIRA_DATA_HOME_VARIABLE = "JIRA_DATA_HOME";
var PLUGIN_DATA_FLAG = "--plugin-data";
var DATA_DIRECTORY_NAME = ".jira";
var NO_HOME_DIRECTORY_MESSAGE = `No plugin data directory resolved: the default ~/${DATA_DIRECTORY_NAME} needs a home directory, and neither ${JIRA_DATA_HOME_VARIABLE} nor ${PLUGIN_DATA_FLAG} <dir> is set.`;
function resolvePluginDataDirectory(env, override, homeDirectory = resolveHomeDirectory) {
  const explicit = nonEmpty3(override) ?? nonEmpty3(env[JIRA_DATA_HOME_VARIABLE]);
  if (explicit !== void 0) return explicit;
  const home = nonEmpty3(homeDirectory());
  return home === void 0 ? void 0 : path6.join(home, DATA_DIRECTORY_NAME);
}
function resolveHomeDirectory() {
  try {
    return os3.homedir();
  } catch {
    return void 0;
  }
}
function nonEmpty3(value) {
  return value !== void 0 && value.length > 0 ? value : void 0;
}

// ../../plugins/jira/src/memory/analytics.ts
var MEMORY_FAILURE_STAGES = [
  "validation",
  "repository-check",
  "version-check",
  "search"
];

// ../../plugins/jira/src/signals/command-analytics.ts
var TEMPLATE_SOURCES = ["built-in", "repo", "raw", "mixed"];
function assetSiteSource(explicitSite, indexedSite) {
  return explicitSite !== void 0 ? "explicit" : indexedSite !== void 0 ? "index" : "twgDefault";
}
var linkSignalNotes = [];
function noteLinkSignal(note) {
  linkSignalNotes.push(note);
}
var assetRetrievalNotes = [];
var adoptionNotes = [];
var memorySearchNote;
function noteAssetRetrieval(note) {
  if (isAssetRead(note)) assetRetrievalNotes.push(note);
}
function noteAdoption(note) {
  adoptionNotes.push(note);
}
function takeOutcomeNotes() {
  const taken = {
    retrievals: assetRetrievalNotes,
    adoptions: adoptionNotes,
    ...linkSignalNotes.length > 0 ? { linkSignals: linkSignalNotes } : {},
    ...memorySearchNote !== void 0 ? { memorySearch: memorySearchNote } : {}
  };
  assetRetrievalNotes = [];
  adoptionNotes = [];
  linkSignalNotes = [];
  memorySearchNote = void 0;
  return taken;
}
function pullRequestAri(repositoryUuid, id) {
  return `ari:cloud:bitbucket::pullrequest/${repositoryUuid}:${String(id)}`;
}
function adoptionsFromPublish(verdict) {
  const notes = [];
  const tree = verdict.tree;
  const head = tree?.commits[0]?.sha ?? "HEAD";
  for (const write of verdict.applied) {
    if (write.step === "push") {
      notes.push({ aiResultAction: "branchPushed" });
    } else if (write.step === "pull-request" && write.action === "create") {
      const repositoryUuid = write.repositoryUuid;
      notes.push({
        aiResultAction: "pullRequestOpened",
        ...repositoryUuid !== void 0 && write.id !== null ? { pullRequestResourceAri: pullRequestAri(repositoryUuid, write.id) } : {},
        ...tree !== null ? { diff: { path: tree.path, baseRef: tree.baseRef, head } } : {}
      });
    } else if (write.step === "comment") {
      notes.push({ aiResultAction: "commentPosted" });
    } else if (write.step === "transition") {
      notes.push({ aiResultAction: "workItemTransitioned" });
    }
  }
  return notes;
}
var asSource = (value) => value === "built-in" || value === "repo" || value === "raw" ? value : void 0;
function templateSourceOf(commandPath, verdict) {
  if (verdict === void 0) return void 0;
  if (commandPath === "work-item draft-validate") {
    return asSource(verdict.source);
  }
  if (commandPath === "changes publish") {
    const templates = verdict.plan?.templates;
    const sources2 = [templates?.comment, templates?.pullRequest].filter((plan) => plan !== null && plan !== void 0).map((plan) => asSource(plan.source));
    if (sources2.length === 0 || sources2.includes(void 0)) return void 0;
    return sources2.every((source) => source === sources2[0]) ? sources2[0] : "mixed";
  }
  return void 0;
}
var EMIT_COMMAND_PATH = "analytics emit";
var NO_SESSION_ID_CODE = "no-session-id";
var ERROR_TABLE = {
  "twg-not-found": { stage: "auth", message: "The twg CLI is not installed or not on PATH" },
  "not-authenticated": { stage: "auth", message: "The twg CLI is not signed in" },
  "site-unresolved": { stage: "resolve", message: "The work item site could not be resolved" },
  "wrong-site": { stage: "resolve", message: "The work item is not on the site in use" },
  "cloud-id-unresolved": { stage: "resolve", message: "The site cloud id could not be resolved" },
  "key-unresolved": { stage: "resolve", message: "The created work item key could not be read" },
  "project-unresolved": { stage: "resolve", message: "The Jira project could not be resolved" },
  "work-type-unresolved": { stage: "resolve", message: "The work type could not be resolved" },
  "fetch-failed": { stage: "assetRetrieval", message: "The work item could not be read from Jira" },
  [NO_SESSION_ID_CODE]: {
    stage: "sessionRegister",
    message: "No session id was available for the command"
  },
  "acps-put-failed": {
    stage: "writeback",
    message: "The session writeback to the session store failed"
  },
  "twg-upgrade-required": {
    stage: "writeback",
    message: "The installed TWG CLI does not support the session writeback command"
  }
};
function errorFor(outcome) {
  if (outcome.verdictStatus !== "fail" && outcome.verdictStatus !== "crashed") {
    return void 0;
  }
  const code = outcome.reasonCodes[0];
  const entry = code !== void 0 ? ERROR_TABLE[code] : void 0;
  return code !== void 0 && entry !== void 0 ? { aiErrorCode: code, aiErrorMessage: entry.message, errorStage: entry.stage } : void 0;
}
function invokedByOf(commandPath) {
  const [head, second] = commandPath.split(" ");
  if (head === "hook" || head === "gc" || head === "session" && second === "signal") {
    return "hook";
  }
  return "agent";
}
function commandPathOf(command) {
  const names = [];
  for (let current = command; current?.parent; current = current.parent) {
    names.unshift(current.name());
  }
  return names.join(" ");
}
function commandPathFromArgv(program2, argv) {
  const names = [];
  let current = program2;
  for (const word of argv) {
    if (word.startsWith("-")) continue;
    const next = current.commands.find((command) => command.name() === word);
    if (next === void 0) break;
    names.push(word);
    current = next;
    if (current.commands.length === 0) break;
  }
  return names.join(" ");
}
var REPORT_ONLY_WHEN_ACTED = /* @__PURE__ */ new Set([
  "hook turn-activity",
  "hook link-prompt",
  "hook commit-guard",
  "hook onboarding"
]);
function shouldReport(commandPath, hookAction, error) {
  return !REPORT_ONLY_WHEN_ACTED.has(commandPath) || hookAction !== void 0 || error !== void 0;
}
var noted;
function noteHookAction(code) {
  noted = code;
}
function takeHookAction() {
  const code = noted;
  noted = void 0;
  return code;
}
function outcomeOf(input) {
  const { status, codes } = classify(input);
  let memory = input.commandPath === "memory search" ? input.memorySearch : void 0;
  if (input.error !== void 0 && memory?.status === void 0 && memory?.failureStage === void 0) {
    memory = void 0;
  }
  const templateSource = input.error === void 0 ? templateSourceOf(input.commandPath, input.verdict) : void 0;
  return {
    commandPath: input.commandPath,
    verdictStatus: memory?.status ?? status,
    reasonCodes: memory?.code !== void 0 ? [memory.code] : codes,
    exitCode: input.exitCode,
    durationMs: Math.max(0, Math.round(input.now - input.startedAt)),
    invokedBy: invokedByOf(input.commandPath),
    occurredAt: input.startedAt,
    ...templateSource !== void 0 ? { templateSource } : {},
    ...input.retrievals !== void 0 && input.retrievals.length > 0 ? { retrievals: [...input.retrievals] } : {},
    ...input.adoptions !== void 0 && input.adoptions.length > 0 ? { adoptions: [...input.adoptions] } : {},
    ...input.linkSignals !== void 0 && input.linkSignals.length > 0 ? { linkSignals: [...input.linkSignals] } : {},
    ...memory?.resultCount !== void 0 ? { memoryResultCount: memory.resultCount } : {},
    ...memory?.failureStage !== void 0 ? { memoryFailureStage: memory.failureStage } : {}
  };
}
function classify(input) {
  const { error, verdict } = input;
  if (error !== void 0) {
    if (error instanceof UsageError) {
      return { status: "usage-error", codes: [] };
    }
    if (error instanceof CommanderError) {
      return { status: "usage-error", codes: [error.code] };
    }
    if (error instanceof Error && error.message === NO_SESSION_ID_MESSAGE) {
      return { status: "crashed", codes: [NO_SESSION_ID_CODE] };
    }
    const code = typeof error === "object" && error !== null ? error.code : void 0;
    return { status: "crashed", codes: typeof code === "string" ? [code] : [] };
  }
  if (verdict !== void 0) {
    return { status: verdict.status, codes: verdict.reasons.map((reason) => reason.code) };
  }
  return {
    status: input.exitCode === 0 ? "pass" : "crashed",
    codes: input.hookAction !== void 0 ? [input.hookAction] : []
  };
}
function encodeOutcome(outcome) {
  return Buffer.from(JSON.stringify(outcome), "utf8").toString("base64url");
}
function decodeOutcome(encoded) {
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return isOutcome(value) ? value : void 0;
  } catch {
    return void 0;
  }
}
var STATUSES = ["pass", "warn", "fail", "usage-error", "crashed"];
function isOutcome(value) {
  if (typeof value !== "object" || value === null) return false;
  const v = value;
  return typeof v.commandPath === "string" && typeof v.verdictStatus === "string" && STATUSES.includes(v.verdictStatus) && Array.isArray(v.reasonCodes) && v.reasonCodes.every((code) => typeof code === "string") && typeof v.exitCode === "number" && typeof v.durationMs === "number" && (v.invokedBy === "hook" || v.invokedBy === "agent") && typeof v.occurredAt === "number" && (v.templateSource === void 0 || typeof v.templateSource === "string" && TEMPLATE_SOURCES.includes(v.templateSource)) && (v.retrievals === void 0 || Array.isArray(v.retrievals) && v.retrievals.every(isAssetRead)) && (v.adoptions === void 0 || Array.isArray(v.adoptions) && v.adoptions.every(isAdoptionNote)) && (v.linkSignals === void 0 || Array.isArray(v.linkSignals) && v.linkSignals.every((note) => {
    if (typeof note !== "object" || note === null) return false;
    const n = note;
    return typeof n.linkId === "string" && typeof n.posted === "boolean";
  })) && (v.memoryResultCount === void 0 || v.commandPath === "memory search" && typeof v.memoryResultCount === "number" && Number.isSafeInteger(v.memoryResultCount) && v.memoryResultCount >= 0) && (v.memoryFailureStage === void 0 || v.commandPath === "memory search" && MEMORY_FAILURE_STAGES.some((stage) => stage === v.memoryFailureStage));
}
var RESULT_ACTIONS = [
  "workItemCreated",
  "workItemClaimed",
  "workItemTransitioned",
  "branchPushed",
  "pullRequestOpened",
  "commentPosted"
];
function isAdoptionNote(value) {
  if (typeof value !== "object" || value === null) return false;
  const v = value;
  const diff = v.diff;
  return typeof v.aiResultAction === "string" && RESULT_ACTIONS.includes(v.aiResultAction) && (v.pullRequestResourceAri === void 0 || typeof v.pullRequestResourceAri === "string") && (diff === void 0 || typeof diff === "object" && diff !== null && typeof diff.path === "string" && typeof diff.baseRef === "string" && typeof diff.head === "string");
}
function deferCommandAnalytics(outcome, options = {}) {
  try {
    const env = options.env ?? process.env;
    if (outcome.commandPath === EMIT_COMMAND_PATH) {
      return;
    }
    const deferred = !isAnalyticsDisabled(env) && options.sessionId !== void 0;
    const mapped = errorFor(outcome);
    logSignalEvent(
      "command-outcome",
      {
        commandPath: outcome.commandPath,
        verdictStatus: outcome.verdictStatus,
        reasonCodes: [...outcome.reasonCodes],
        exitCode: outcome.exitCode,
        durationMs: outcome.durationMs,
        // The debug log names the tree that ran, to tell a dev-link install from a real one.
        pluginVersion: readPluginVersion(import.meta.url),
        invokedBy: outcome.invokedBy,
        ...outcome.templateSource !== void 0 ? { templateSource: outcome.templateSource } : {},
        ...outcome.memoryResultCount !== void 0 ? { memoryResultCount: outcome.memoryResultCount } : {},
        ...outcome.memoryFailureStage !== void 0 ? { memoryFailureStage: outcome.memoryFailureStage } : {},
        ...mapped !== void 0 ? { errorStage: mapped.errorStage } : {},
        retrievals: outcome.retrievals?.length ?? 0,
        adoptions: (outcome.adoptions ?? []).map((adoption) => adoption.aiResultAction),
        deferred
      },
      { env, write: options.logWrite }
    );
    if (!deferred || options.sessionId === void 0) {
      return;
    }
    const args = [
      "analytics",
      "emit",
      "--outcome",
      encodeOutcome(outcome),
      "--session-id",
      options.sessionId,
      ...options.pluginDataDirectory !== void 0 ? [PLUGIN_DATA_FLAG, options.pluginDataDirectory] : []
    ];
    (options.spawnChild ?? spawnDetached)(args);
  } catch {
  }
}
function spawnDetached(args) {
  const child = spawn(process.execPath, [process.argv[1] ?? "", ...args], {
    detached: true,
    stdio: "ignore"
  });
  child.on("error", () => {
  });
  child.unref();
}
async function emitCommandOutcome(outcome, sessionId, deps) {
  const emitCommand = deps.emitCommand ?? emitCommandAnalytics;
  const emitError = deps.emitError ?? emitErrorAnalytics;
  const metadata = await cachedMetadata(
    deps.sessionStore,
    deps.resolveMetadata ?? (() => resolveAnalyticsMetadata())
  );
  const options = {
    sessionStore: deps.sessionStore,
    resolveMetadata: () => metadata,
    ...deps.queueStore !== void 0 ? { queueStore: deps.queueStore } : {}
  };
  await emitCommand({ agentSessionId: sessionId, ...outcome }, options);
  const emitAssetRetrieval = deps.emitAssetRetrieval ?? emitAssetRetrievalAnalytics;
  const emitAdopted = deps.emitAdopted ?? emitAdoptedAnalytics;
  const countFiles = deps.countChangedFiles ?? countChangedFilesWithGit;
  for (const retrieval of outcome.retrievals ?? []) {
    await emitAssetRetrieval(
      { agentSessionId: sessionId, ...retrieval, occurredAt: outcome.occurredAt },
      options
    );
  }
  const jiraIssueId = [...outcome.retrievals ?? []].reverse().find((c) => c.issueId !== void 0)?.issueId;
  for (const adoption of outcome.adoptions ?? []) {
    const codeFilesCreated = adoption.diff !== void 0 ? countFiles(adoption.diff) : void 0;
    await emitAdopted(
      {
        agentSessionId: sessionId,
        aiResultAction: adoption.aiResultAction,
        ...jiraIssueId !== void 0 ? { jiraIssueId } : {},
        ...adoption.pullRequestResourceAri !== void 0 ? { pullRequestResourceAri: adoption.pullRequestResourceAri } : {},
        ...codeFilesCreated !== void 0 ? { codeFilesCreated } : {},
        occurredAt: outcome.occurredAt
      },
      options
    );
  }
  if (outcome.linkSignals?.length) {
    const recorded = await createJiraLinkSignalStore(deps.sessionStore).listRecorded();
    for (const note of outcome.linkSignals) {
      if (!note.posted) {
        const writeback = ERROR_TABLE["acps-put-failed"];
        await emitError(
          {
            agentSessionId: sessionId,
            aiErrorCode: "acps-put-failed",
            aiErrorMessage: writeback.message,
            errorStage: writeback.stage,
            commandPath: "session signal flush"
          },
          options
        );
        continue;
      }
      const link2 = recorded.find(
        (link3) => hashIdentifier(`${link3.cloudId}/${link3.issueKey}`) === note.linkId
      );
      if (link2 === void 0) continue;
      const branch = () => {
        try {
          return (deps.readBranch ?? (() => currentBranch(process.cwd())))();
        } catch {
          return null;
        }
      };
      await (deps.emitLink ?? emitLinkAnalytics)(
        {
          agentSessionId: sessionId,
          issueId: link2.issueId,
          projectId: link2.projectId,
          tenantId: link2.cloudId,
          linkSource: link2.linkSource === "workItemFetch" ? resolveFetchLinkSource(branch(), link2.issueKey) : link2.linkSource ?? "unknown",
          linkPromptShown: await wasLinkPromptShown(deps.sessionStore)
        },
        options
      );
    }
  }
  const mapped = errorFor(outcome);
  if (mapped !== void 0) {
    await emitError(
      {
        agentSessionId: sessionId,
        ...mapped,
        commandPath: outcome.commandPath,
        occurredAt: outcome.occurredAt
      },
      options
    );
  }
}
function countChangedFilesWithGit(diff) {
  try {
    const result = runGit(diff.path, ["diff", "--name-only", `${diff.baseRef}...${diff.head}`]);
    if (!result.ok) return void 0;
    return result.stdout.split("\n").filter((line) => line.trim().length > 0).length;
  } catch {
    return void 0;
  }
}
var metadataCodec = {
  // v2 adds `hashedUserId` and `userSegment`. A v1 entry may hold an external
  // user's raw account id, so it is dropped (a cache miss) rather than migrated.
  version: 2,
  encode: (value) => ({
    ...value.userId !== void 0 ? { userId: value.userId } : {},
    ...value.hashedUserId !== void 0 ? { hashedUserId: value.hashedUserId } : {},
    ...value.userSegment !== void 0 ? { userSegment: value.userSegment } : {},
    ...value.tenantId !== void 0 ? { tenantId: value.tenantId } : {},
    ...value.cliVersion !== void 0 ? { cliVersion: value.cliVersion } : {}
  }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const read = (key) => typeof value[key] === "string" ? value[key] : void 0;
    const userId = read("userId");
    const hashedUserId = read("hashedUserId");
    const segment = read("userSegment");
    const userSegment = segment === "internal" || segment === "external" ? segment : void 0;
    const tenantId = read("tenantId");
    const cliVersion = read("cliVersion");
    return {
      ...userId !== void 0 ? { userId } : {},
      ...hashedUserId !== void 0 ? { hashedUserId } : {},
      ...userSegment !== void 0 ? { userSegment } : {},
      ...tenantId !== void 0 ? { tenantId } : {},
      ...cliVersion !== void 0 ? { cliVersion } : {}
    };
  }
};
var metadataKey = defineStorageKey(
  "jira/analytics/metadata",
  metadataCodec
);
async function cachedMetadata(store, resolve2) {
  try {
    const cached = await store.get(metadataKey);
    if (cached !== void 0) {
      return cached;
    }
  } catch {
  }
  const metadata = resolve2();
  if (metadata.userId !== void 0 || metadata.hashedUserId !== void 0 || metadata.tenantId !== void 0) {
    try {
      await store.set(metadataKey, metadata);
    } catch {
    }
  }
  return metadata;
}

// ../../plugins/jira/src/work-item/twg-messages.ts
function twgNotFoundDetail(where, undone) {
  return `${where}. Install and log in with twg first; see /twg-setup. Nothing was ${undone}.`;
}
function notAuthenticatedDetail(detail, undone) {
  return `twg is not authenticated: ${detail ?? "auth failed"}. Run twg login; see /twg-setup. Nothing was ${undone}.`;
}

// ../../plugins/jira/src/work-item/fetch.ts
function resolveFetchLinkSource(branch, key) {
  if (branch === null) {
    return "workItemFetch";
  }
  const carries = new RegExp(`(?<![A-Za-z0-9_])${key}(?![0-9])`, "i").test(branch);
  return carries ? "branchName" : "workItemFetch";
}
var FetchWorkItemError = class extends Error {
  code;
  /** The candidate sites, on `wrong-site` and `cloud-id-unresolved`, so a caller can offer them as a choice rather than re-listing. */
  sites;
  constructor(code, message, sites = []) {
    super(message);
    this.name = "FetchWorkItemError";
    this.code = code;
    this.sites = sites;
  }
};
async function fetchWorkItem(options) {
  try {
    return await fetchWorkItemUnchecked(options);
  } catch (error) {
    if (error instanceof TwgNotFoundError) {
      throw twgNotFound(error.message);
    }
    throw error;
  }
}
async function fetchWorkItemUnchecked(options) {
  const { key, site, scope, memory } = options;
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const binary = resolveTwgBinary(env);
  const chosenSite = site ?? await resolveIndexedSite(memory, key);
  const { siteInForce, sites, matched } = resolveLiveSite(binary, runner, chosenSite);
  if (matched === void 0) {
    throw new FetchWorkItemError(
      "cloud-id-unresolved",
      `Could not resolve the cloud id for ${describeSite(siteInForce)} from twg access. ${listCandidates2(sites)} Pass --site with one of these; nothing was stored.`,
      sites
    );
  }
  const read = runner(binary, ["jira", "workitem", "get", key, "--full"], { site: chosenSite });
  if (!read.ok) {
    if (isAuthFailure(read.detail)) {
      throw notAuthenticated(read.detail);
    }
    if (isMissingOrForbidden(read.detail)) {
      throw classifyMissingKey(key, siteInForce, chosenSite, read.detail, sites, binary, runner);
    }
    throw new FetchWorkItemError(
      "fetch-failed",
      `Reading ${key} from Jira failed: ${read.detail ?? "twg exited non-zero"}. Nothing was stored.`
    );
  }
  const payload = read.payload;
  const unwrapped = payload === void 0 ? void 0 : unwrapWorkItemEnvelope(payload);
  if (unwrapped === void 0) {
    throw new FetchWorkItemError(
      "not-a-work-item",
      `twg returned no work item for ${key}. Nothing was stored.`
    );
  }
  const cloudId = asCloudId(matched.cloudId);
  const hoisted = hoistFields(unwrapped);
  const prepared = prepareWorkItemForStorage(cloudId, payload, { site: matched.url });
  await memory.setWorkItem(scope, prepared);
  const projectContext = buildProjectContext(hoisted.project, cloudId, matched);
  if (projectContext !== void 0) {
    await memory.setProjectContext(projectContext);
  }
  const issueId = typeof hoisted.id === "string" ? hoisted.id : void 0;
  if (scope === "session") {
    const projectId = projectIdOf(hoisted.project);
    await createJiraLinkSignalStore(memory.session).recordPending({
      cloudId,
      issueKey: prepared.key,
      ...issueId !== void 0 ? { issueId } : {},
      ...projectId !== void 0 ? { projectId } : {},
      linkSource: options.linkSource ?? "workItemFetch"
    });
  }
  const stored = await memory.getWorkItem(scope, cloudId, prepared.key);
  noteAssetRetrieval({
    assetType: CONTENT.workItem.assetType,
    assetCount: 1,
    ...issueId !== void 0 ? { issueId } : {},
    // Reusing a session link does not make a live Jira fetch a cache hit.
    retrievalSource: "liveAtlassian",
    siteSource: assetSiteSource(site, chosenSite)
  });
  return stored ?? prepared;
}
function resolveLiveSite(binary, runner, site, undone = "stored") {
  const siteInForce = site ?? resolveDefaultSite(binary, runner, undone);
  const sites = listJiraSites(binary, runner, undone);
  const matched = siteInForce === void 0 ? void 0 : matchSite(sites, siteInForce, jiraSiteAccessors);
  return { siteInForce, sites, matched };
}
function buildProjectContext(project, cloudId, site) {
  if (project === void 0 || !isJsonObject(project)) {
    return void 0;
  }
  const projectId = project.id;
  const projectKey = project.key;
  const projectName = project.name;
  if (typeof projectId !== "string" || typeof projectKey !== "string" || typeof projectName !== "string") {
    return void 0;
  }
  try {
    return {
      cloudId,
      projectId: asProjectId(projectId),
      projectKey: asProjectKey(projectKey),
      projectName,
      tenantName: site.name.length > 0 ? site.name : hostLabel(site.url),
      siteUrl: site.url,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return void 0;
  }
}
function projectIdOf(project) {
  return project !== void 0 && isJsonObject(project) && typeof project.id === "string" ? project.id : void 0;
}
function twgNotFound(where) {
  return new FetchWorkItemError("twg-not-found", twgNotFoundDetail(where, "stored"));
}
function notAuthenticated(detail, undone = "stored") {
  return new FetchWorkItemError("not-authenticated", notAuthenticatedDetail(detail, undone));
}
function resolveDefaultSite(binary, runner, undone) {
  const result = runner(binary, ["doctor"]);
  if (!result.ok) {
    if (isAuthFailure(result.detail)) {
      throw notAuthenticated(result.detail, undone);
    }
    return void 0;
  }
  const fields = readPath(result.payload, ["data", "auth", "config", "fields"]);
  if (fields === void 0 || !isJsonObject(fields)) {
    return void 0;
  }
  const domain = fields.domain;
  const shortSite = fields.site;
  if (typeof domain === "string" && domain.length > 0) {
    return domain;
  }
  return typeof shortSite === "string" && shortSite.length > 0 ? shortSite : void 0;
}
function listJiraSites(binary, runner, undone) {
  const result = runner(binary, ["access"]);
  if (!result.ok) {
    if (isAuthFailure(result.detail)) {
      throw notAuthenticated(result.detail, undone);
    }
    throw new FetchWorkItemError(
      "cloud-id-unresolved",
      `Could not enumerate Jira sites from twg access: ${result.detail ?? "twg exited non-zero"}. Nothing was ${undone}.`
    );
  }
  const products = readPath(result.payload, ["data", "products"]);
  if (!Array.isArray(products)) {
    return [];
  }
  const byCloudId = /* @__PURE__ */ new Map();
  for (const product of products) {
    if (!isJsonObject(product) || !isJiraProduct(product.productId)) {
      continue;
    }
    const productSites = product.sites;
    if (!Array.isArray(productSites)) {
      continue;
    }
    for (const site of productSites) {
      if (!isJsonObject(site)) {
        continue;
      }
      const name = site.name;
      const url = site.url;
      const cloudId = site.cloudId;
      if (typeof name === "string" && typeof url === "string" && typeof cloudId === "string") {
        byCloudId.set(cloudId, { name, url, cloudId });
      }
    }
  }
  return [...byCloudId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function projectKeyOf2(key) {
  const match = /^([A-Za-z][A-Za-z0-9_]*)-\d+$/.exec(key);
  return match?.[1];
}
function projectPresenceOnSite(binary, runner, projectKey, site) {
  const result = runner(binary, ["jira", "space", "get", projectKey], { site });
  if (!result.ok) {
    return result.malformed !== true && isMissingOrForbidden(result.detail) ? "absent" : "unknown";
  }
  const data = result.payload !== void 0 && isJsonObject(result.payload) && "data" in result.payload ? result.payload.data : result.payload;
  const items = data === void 0 ? [] : Array.isArray(data) ? data : [data];
  return items.some((item) => isJsonObject(item) && typeof item.key === "string") ? "present" : "unknown";
}
function projectExistsOnSite(binary, runner, projectKey, site) {
  return projectPresenceOnSite(binary, runner, projectKey, site) === "present";
}
function classifyMissingKey(key, siteInForce, chosenSite, detail, sites, binary, runner) {
  const projectKey = projectKeyOf2(key);
  if (projectKey !== void 0 && projectExistsOnSite(binary, runner, projectKey, chosenSite)) {
    return new FetchWorkItemError(
      "work-item-not-found",
      `Couldn't find ${key} in project ${projectKey} on ${describeSite(siteInForce)}. Nothing was stored.`
    );
  }
  return new FetchWorkItemError(
    "wrong-site",
    `${key} was not readable on ${describeSite(siteInForce)}: ${detail ?? "not found"}. Ask the user which site to use; do not try another site unprompted. ${listCandidates2(sites)} Nothing was stored.`,
    sites
  );
}
function isJiraProduct(productId) {
  return typeof productId === "string" && productId.startsWith("jira");
}
var jiraSiteAccessors = {
  cloudId: (site) => site.cloudId,
  name: (site) => site.name,
  url: (site) => site.url
};
function describeSite(siteInForce) {
  return siteInForce === void 0 ? "twg's default site (unresolved)" : `site ${siteInForce}`;
}
function listCandidates2(sites) {
  if (sites.length === 0) {
    return "twg access returned no Jira sites.";
  }
  const lines = sites.map((site) => `  - ${site.name} (${site.url})`).join("\n");
  return `Candidate sites:
${lines}`;
}
function isAuthFailure(detail) {
  const text6 = String(detail ?? "").toLowerCase();
  return text6.includes("auth") || text6.includes("401") || text6.includes("log in") || text6.includes("login") || text6.includes("expired") || text6.includes("revoked");
}
function isMissingOrForbidden(detail) {
  const text6 = String(detail ?? "").toLowerCase();
  return text6.includes("not found") || text6.includes("does not exist") || text6.includes("no such") || text6.includes("404") || text6.includes("permission") || text6.includes("forbidden") || text6.includes("403");
}
function readPath(value, path8) {
  let current = value;
  for (const segment of path8) {
    if (current === void 0 || !isJsonObject(current)) {
      return void 0;
    }
    current = current[segment];
  }
  return current;
}

// ../../plugins/jira/src/branch/fetch.ts
var FETCH_TIMEOUT_MS = 3e4;
async function resolveFetch(flag, remote, store) {
  if (flag !== void 0) return { enabled: flag, source: "flag" };
  const preference = remote !== null && store !== void 0 ? (await getRepositoryPreferences(store, remote))?.fetch : void 0;
  return preference === void 0 ? { enabled: true, source: "default" } : { enabled: preference === "on", source: "preference" };
}
function fetchBase(root, defaultBranch2, git) {
  return fetch(root, "origin", { refs: [defaultBranch2], timeoutMs: FETCH_TIMEOUT_MS }, git);
}
function fetchFailure(result) {
  return result.timedOut ? { cause: "timeout", verb: "timed out" } : { cause: "failed", verb: "failed" };
}
function noFetchDetail(decision, remote) {
  if (decision.source === "preference" && remote !== null) {
    return `the fetch is off for ${remote.host}/${remote.workspace}/${remote.slug}; branch fetch-base on turns it back on`;
  }
  return "fetch origin first";
}

// ../../plugins/jira/src/branch/prepare.ts
var PREPARE_BRANCH_SCHEMA = "jira-workflows/prepare-branch/v1";
var SLUG_MIN_WORDS = 2;
var SLUG_MAX_WORDS = 4;
var STOP_WORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "in",
  "on",
  "for",
  "and",
  "or",
  "with",
  "is",
  "are",
  "be",
  "as",
  "at",
  "by",
  "from",
  "into"
]);
function carriesKey(branch, key) {
  return new RegExp(`(?<![A-Za-z0-9_])${key}(?![0-9])`, "i").test(branch);
}
function slugify(summary) {
  const words = String(summary ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const kept = words.filter((word) => !STOP_WORDS.has(word));
  const chosen = kept.length >= SLUG_MIN_WORDS ? kept : words;
  return chosen.slice(0, SLUG_MAX_WORDS).join("-") || "work";
}
function branchName(key, summary, override) {
  if (override !== void 0) {
    return carriesKey(override, key) ? override : `${key}/${override}`;
  }
  return `${key}/${slugify(summary)}`;
}
function locateTree(path8, options) {
  const { git, probe } = options;
  const root = topLevel(path8, git);
  if (root === null) {
    return {
      error: { code: "not-a-git-tree", detail: `${path8} is not inside a git working tree` }
    };
  }
  const probed = probe(root);
  if (!probed.ok) {
    return { error: { code: "not-writable", detail: `${root} is not writable: ${probed.detail}` } };
  }
  const origin = remoteUrl(root, "origin", git);
  if (origin === null) {
    return { error: { code: "no-origin", detail: `${root} has no origin remote` } };
  }
  return { located: { root, remote: parseRemote(origin) ?? null } };
}
function readTree(located, options) {
  const { git } = options;
  const { root, remote } = located;
  const branch = currentBranch(root, git);
  if (branch === null) {
    return {
      error: {
        code: "detached-head",
        detail: `${root} is on a detached HEAD; check out a branch first`
      }
    };
  }
  const named = defaultBranch(root, git);
  if (named === null) {
    return {
      error: {
        code: "default-branch-unknown",
        detail: "origin/HEAD names no branch and neither origin/main nor origin/master exists"
      }
    };
  }
  const baseRef = `origin/${named}`;
  if (!refExists(root, baseRef, git)) {
    const fetched = options.fetch.enabled ? fetchBase(root, named, git) : null;
    if (fetched === null || !fetched.ok || !refExists(root, baseRef, git)) {
      const why = fetched === null ? noFetchDetail(options.fetch, remote) : `git fetch origin ${named} ${fetched.ok ? "did not bring it" : "failed"}: ${gitFailure(fetched, "git exited non-zero")}`;
      return {
        error: {
          code: "base-ref-missing",
          detail: `${baseRef} does not exist locally; ${why}`
        }
      };
    }
  }
  const counts = changeCounts(root, git);
  return {
    tree: {
      path: root,
      remote,
      branch,
      defaultBranch: named,
      baseRef,
      staged: counts.staged,
      unstaged: counts.unstaged,
      untracked: counts.untracked,
      lfs: lfsTracked(root, git),
      fetch: options.fetch
    }
  };
}
function planBranch(tree, options) {
  const { key, branch, base: base2, keepChanges = false, stash = false, worktree } = options;
  const exists = options.exists ?? (() => false);
  const decisions = [];
  const modified = tree.unstaged - tree.untracked;
  const dirty = tree.staged + modified > 0;
  const onDefault = tree.branch === tree.defaultBranch;
  if (carriesKey(tree.branch, key)) {
    return {
      plan: { action: "reuse", branch: tree.branch, base: null, changes: "none", worktree: null },
      decisions
    };
  }
  const action = exists(branch) ? "checkout-existing" : "create";
  let resolvedBase = null;
  if (action === "create") {
    if (base2 === "current") {
      resolvedBase = null;
    } else if (base2 === "default" || base2 === void 0 && onDefault) {
      resolvedBase = tree.baseRef;
    } else if (base2 !== void 0) {
      resolvedBase = base2;
    } else {
      decisions.push({
        code: "base-needed",
        detail: `${tree.path} is on ${tree.branch}, not ${tree.defaultBranch}; re-run with --base default to cut ${branch} off ${tree.baseRef}, or --base current to cut it off ${tree.branch}`
      });
    }
  }
  let changes = "none";
  if (dirty) {
    if (worktree !== void 0) changes = "worktree";
    else if (stash) changes = "stashed";
    else if (keepChanges) changes = "kept";
    else {
      const untracked = tree.untracked > 0 ? ` and ${tree.untracked} untracked file(s)` : "";
      decisions.push({
        code: "changes-pending",
        detail: `${tree.path} has ${tree.staged} staged and ${modified} unstaged change(s) to tracked files${untracked}; re-run with --keep-changes to carry them onto ${branch}, --stash to stash them first, or --worktree <path> to leave this tree alone`
      });
    }
  }
  return {
    plan: {
      action,
      branch,
      base: resolvedBase,
      changes,
      worktree: worktree !== void 0 ? resolve(worktree) : null
    },
    decisions
  };
}
function renderPanels(applied) {
  const panels = [];
  for (const entry of applied) {
    if (entry.step === "stash") panels.push(actionPanel("stashed", entry.stash));
    if (entry.step === "worktree") {
      panels.push(actionPanel("worktree-created", { path: entry.path, branch: entry.branch }));
    }
    if (entry.step === "create") {
      panels.push(actionPanel("branch-created", { branch: entry.branch, base: entry.base }));
    }
  }
  return panels.join("\n");
}
var firstLine2 = (text6) => text6.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
var gitFailure = (result, fallback) => firstLine2(result.stderr) || firstLine2(result.stdout) || fallback;
function checkArguments(options) {
  const key = issueKeyArgument(options.key);
  const chosen = [
    options.keepChanges ? "--keep-changes" : void 0,
    options.stash ? "--stash" : void 0,
    options.worktree !== void 0 ? "--worktree" : void 0
  ].filter((flag) => flag !== void 0);
  if (chosen.length > 1) {
    throw new UsageError(`${chosen.join(" and ")} exclude each other`);
  }
  return key;
}
function itemUrl(item) {
  if (item.url) return item.url;
  const site = String(item.site ?? "").trim();
  return site ? browseUrl(site, item.key) : null;
}
async function readItem(key, options) {
  const { memory } = options;
  if (memory === void 0) {
    throw new Error("prepareBranch needs memory to read the item, or an item or branch given");
  }
  try {
    const stored = await fetchWorkItem({
      key,
      site: options.site,
      scope: options.scope ?? "session",
      memory,
      runner: options.runner,
      env: options.env
    });
    const siteUrl = typeof stored.site === "string" ? stored.site : null;
    return {
      item: { key: stored.key, summary: stored.summary, url: itemUrl({ key, site: siteUrl }) },
      site: options.site ?? (siteUrl ? hostLabel(siteUrl) : null)
    };
  } catch (error) {
    if (!(error instanceof FetchWorkItemError)) throw error;
    if (error.code === "wrong-site" || error.code === "cloud-id-unresolved") {
      return {
        reasons: [{ code: "site-unresolved", detail: error.message }],
        sites: error.sites
      };
    }
    return { reasons: [{ code: error.code, detail: error.message }] };
  }
}
async function prepareBranch(options) {
  const key = checkArguments(options);
  const git = options.git ?? runGit;
  const probe = options.probe ?? probeWritable;
  const planOnly = options.planOnly ?? false;
  const mode = planOnly ? "plan" : "apply";
  const empty = {
    key,
    site: options.site ?? null,
    mode,
    item: null,
    tree: null,
    plan: null,
    applied: [],
    after: null
  };
  let item;
  let site = options.site ?? null;
  if (options.item !== void 0) {
    const given = options.item;
    item = { key: given.key, summary: given.summary ?? null, url: itemUrl(given) };
  } else if (options.branch !== void 0) {
    item = { key, summary: null, url: null };
  } else {
    const read = await readItem(key, options);
    if ("reasons" in read) {
      return fail(PREPARE_BRANCH_SCHEMA, read.reasons, {
        ...empty,
        ...read.sites !== void 0 ? { sites: read.sites } : {}
      });
    }
    item = read.item;
    site = read.site;
  }
  const branch = branchName(key, item.summary, options.branch);
  const location = locateTree(options.path, { git, probe });
  const found = "error" in location ? location : readTree(location.located, {
    fetch: await resolveFetch(options.fetch, location.located.remote, options.memory?.plugin),
    git
  });
  if ("error" in found) {
    return fail(PREPARE_BRANCH_SCHEMA, [found.error], {
      ...empty,
      site,
      item
    });
  }
  const { tree } = found;
  const { plan, decisions } = planBranch(tree, {
    key,
    branch,
    base: options.base,
    keepChanges: options.keepChanges,
    stash: options.stash,
    worktree: options.worktree,
    exists: (name) => refExists(tree.path, `refs/heads/${name}`, git)
  });
  const common = { ...empty, site, item, tree, plan };
  if (plan.action === "create" && plan.base !== null && !refExists(tree.path, `${plan.base}^{commit}`, git)) {
    return fail(
      PREPARE_BRANCH_SCHEMA,
      [{ code: "base-unknown", detail: `${plan.base} is not a ref this tree resolves` }],
      common
    );
  }
  if (decisions.length > 0) {
    return warn(PREPARE_BRANCH_SCHEMA, decisions, common);
  }
  if (plan.action === "reuse") {
    const reused = {
      code: "branch-reused",
      detail: `${tree.branch} already carries ${key}`
    };
    return pass(
      PREPARE_BRANCH_SCHEMA,
      {
        ...common,
        after: planOnly ? null : { path: tree.path, branch: tree.branch, head: headSha(tree.path, git) }
      },
      { reasons: [reused] }
    );
  }
  if (planOnly) {
    return pass(PREPARE_BRANCH_SCHEMA, common);
  }
  const caveats = [];
  if (plan.action === "create" && plan.base === tree.baseRef && tree.fetch.enabled) {
    const fetched = fetchBase(tree.path, tree.defaultBranch, git);
    if (!fetched.ok) {
      const { cause, verb } = fetchFailure(fetched);
      caveats.push({
        code: "base-stale",
        detail: `git fetch origin ${tree.defaultBranch} ${verb}, so ${plan.branch} is cut off the ${tree.baseRef} this tree last fetched: ${gitFailure(fetched, "git exited non-zero")}`,
        cause
      });
    }
  }
  return applyPlan(key, plan, tree, common, git, caveats);
}
function applyPlan(key, plan, tree, common, git, caveats = []) {
  const applied = [];
  const stop = (code, step, detail) => {
    const reason = { code, detail: `${step}: ${detail}`, step };
    return fail(
      PREPARE_BRANCH_SCHEMA,
      [...caveats, reason],
      { ...common, applied },
      {
        panels: renderPanels(applied)
      }
    );
  };
  if (plan.changes === "stashed") {
    const stashed = stashPush(tree.path, `${key} prepare-branch`, git);
    if (!stashed.ok)
      return stop("write-failed", "stash", gitFailure(stashed, "git stash push failed"));
    applied.push({
      step: "stash",
      ok: true,
      stash: "stash@{0}",
      sha: refSha(tree.path, "refs/stash", git)
    });
  }
  let workPath = tree.path;
  if (plan.worktree !== null) {
    const added = plan.action === "create" ? worktreeAdd(
      tree.path,
      plan.worktree,
      plan.branch,
      { create: true, base: plan.base ?? void 0 },
      git
    ) : worktreeAdd(tree.path, plan.worktree, plan.branch, {}, git);
    if (!added.ok)
      return stop("write-failed", "worktree", gitFailure(added, "git worktree add failed"));
    workPath = topLevel(plan.worktree, git) ?? plan.worktree;
    applied.push({ step: "worktree", ok: true, path: workPath, branch: plan.branch });
    if (plan.action === "create") {
      applied.push({
        step: "create",
        ok: true,
        branch: plan.branch,
        base: plan.base ?? tree.branch,
        via: "worktree"
      });
    } else {
      applied.push({ step: "checkout", ok: true, branch: plan.branch, via: "worktree" });
    }
  } else if (plan.action === "create") {
    const created = checkoutNew(tree.path, plan.branch, plan.base ?? void 0, git);
    if (!created.ok)
      return stop("write-failed", "create", gitFailure(created, "git checkout -b failed"));
    applied.push({ step: "create", ok: true, branch: plan.branch, base: plan.base ?? tree.branch });
  } else {
    const checked = checkout(tree.path, plan.branch, git);
    if (!checked.ok)
      return stop("write-failed", "checkout", gitFailure(checked, "git checkout failed"));
    applied.push({ step: "checkout", ok: true, branch: plan.branch });
  }
  if (plan.action === "create" && plan.base !== null) {
    const head = headSha(workPath, git);
    const expected = refSha(tree.path, plan.base, git);
    if (head === null || head !== expected) {
      return stop(
        "base-mismatch",
        "confirm-base",
        `HEAD is ${head ?? "unknown"} but ${plan.base} is ${expected ?? "unknown"}`
      );
    }
  }
  if (tree.lfs) {
    const lfs = lfsCheckout(workPath, git);
    if (lfs.ok) applied.push({ step: "lfs-checkout", ok: true });
    else
      caveats.push({
        code: "lfs-checkout-failed",
        detail: gitFailure(lfs, "git lfs checkout failed")
      });
  }
  const after = {
    path: workPath,
    branch: currentBranch(workPath, git) ?? plan.branch,
    head: headSha(workPath, git)
  };
  const notes = plan.changes === "none" && plan.worktree === null && tree.untracked > 0 ? [
    {
      code: "untracked-carried",
      detail: `${tree.untracked} untracked file(s) carried onto ${after.branch} untouched`
    }
  ] : [];
  const extra = { ...common, applied, after };
  const panels = renderPanels(applied);
  return caveats.length > 0 ? warn(PREPARE_BRANCH_SCHEMA, [...caveats, ...notes], extra, { panels }) : pass(PREPARE_BRANCH_SCHEMA, extra, { panels, reasons: notes });
}

// ../../plugins/jira/src/commands/no-fetch.ts
function fetchFlag(command) {
  return command.getOptionValueSource("fetch") === "cli" ? false : void 0;
}

// ../../plugins/jira/src/signals/local-session-upgrade.ts
function isLocalSessionCommandUnavailable(result) {
  if (result.ok || result.timedOut || result.status === 77) return false;
  return /^(?:error:\s*)?unknown command ['"](?:integrations|local-session|update)['"]/im.test(
    result.detail ?? ""
  );
}
function emitLocalSessionWithUpgradeReason(operation, options) {
  let unavailable = false;
  const runner = options.runner ?? runTwgJson;
  const posted = emitLocalSession(operation, {
    ...options,
    runner: (binary, args, runOptions) => {
      const result = runner(binary, args, runOptions);
      if (args[0] === "integrations") unavailable = isLocalSessionCommandUnavailable(result);
      return result;
    }
  });
  return {
    posted,
    ...unavailable ? {
      reason: {
        code: "twg-upgrade-required",
        detail: "The installed TWG CLI does not recognize the command needed for Local Agent Sessions. Download the latest TWG CLI binary or run `twg upgrade`. The session link remains pending; retry linking after updating."
      }
    } : {}
  };
}

// ../../plugins/jira/src/signals/working-directory.ts
var WORKING_DIRECTORY_MISSING = "working-directory-missing";
function resolveWorkingDirectory(env = process.env, cwd = () => process.cwd()) {
  try {
    return { path: cwd(), deleted: false };
  } catch {
    const fallback = env.PWD;
    return {
      path: typeof fallback === "string" && fallback.length > 0 ? fallback : void 0,
      deleted: true
    };
  }
}

// ../../plugins/jira/src/signals/hooks.ts
import { text } from "node:stream/consumers";
var INTERACTION_MARKER = "analytics-interaction-initiated";
async function resolveLinkPrompt(sessionStore, payload) {
  if (payload === void 0 || !isJsonObject(payload)) {
    return void 0;
  }
  if (payload.hook_event_name !== "PostToolUse") {
    return void 0;
  }
  const call = readBashCall(payload);
  if (call === void 0) {
    return void 0;
  }
  const touchpoint = detectBashTouchpoint(call);
  if (touchpoint === void 0) {
    return void 0;
  }
  return runPromptLoop(sessionStore, buildLinkSuggestion(LEADS[touchpoint]));
}
function resolveSessionTrigger(branch) {
  return branch !== null && extractFirstIssueKey(branch) !== void 0 ? "branchName" : void 0;
}
function readCurrentBranch() {
  try {
    return currentBranch(process.cwd());
  } catch {
    return null;
  }
}
async function runSessionAnalytics(sessionStore, sessionId, emit2 = (input) => emitInteractionAnalytics(input, { sessionStore }), options = {}) {
  if (!await claimMarker(sessionStore, INTERACTION_MARKER)) {
    return;
  }
  const sessionTrigger = resolveSessionTrigger((options.readBranch ?? readCurrentBranch)());
  const sent = await emit2({
    agentSessionId: sessionId,
    ...sessionTrigger !== void 0 ? { sessionTrigger } : {}
  });
  if (!sent) {
    await releaseMarker(sessionStore, INTERACTION_MARKER);
  }
}
async function readRawHookPayload() {
  if (process.stdin.isTTY === true) return void 0;
  try {
    const raw = await text(process.stdin);
    return raw.trim() === "" ? void 0 : raw;
  } catch {
    return void 0;
  }
}
async function readHookPayload() {
  try {
    const parsed = JSON.parse(await text(process.stdin));
    return isJsonValue(parsed) ? parsed : void 0;
  } catch {
    return void 0;
  }
}

// ../../plugins/jira/src/signals/remote-link-pause.ts
var REMOTE_SESSION_LINK_PAUSED = true;
function isRemoteSessionLinkEnabled(env = process.env) {
  return !REMOTE_SESSION_LINK_PAUSED || env.JIRA_REMOTE_SESSION_LINK === "1";
}

// ../../plugins/jira/src/commands/session-signal.ts
function registerSessionSignalCommands(program2, options) {
  const session = program2.commands.find((command) => command.name() === "session") ?? program2.command("session").description("Signal this Jira session's lifecycle events");
  const signal = session.command("signal").description("Emit a session's ACPS link signal and GAS analytics");
  const stores = createClaudeStores(options);
  signal.command("end").description("Send a local-session end signal for each of this session's linked work items").action(async () => {
    await emitLifecycle(options, stores);
  });
  signal.command("flush").description("Emit any pending link signals this session recorded, then mark them sent").action(async () => {
    const sessionId = options.sessionId;
    logSignalEvent("flush-invoked", { sessionId });
    if (sessionId === void 0) {
      logSignalEvent("flush-skipped", { reason: "no-session-id" });
      return;
    }
    const directory = resolveWorkingDirectory(options.env ?? process.env);
    if (directory.deleted) noteHookAction(WORKING_DIRECTORY_MISSING);
    if (directory.path === void 0) {
      logSignalEvent("flush-skipped", { reason: "no-working-directory" });
    } else {
      await flushLinkSignals(createJiraLinkSignalStore(stores.session), {
        agentSessionId: sessionId,
        workingDirectory: directory.path,
        sessionStore: stores.session,
        queueStore: stores.plugin,
        env: options.env ?? process.env
      });
    }
    await drainAnalyticsQueue({
      store: stores.plugin,
      post: (body) => postQueuedBody(body),
      env: options.env ?? process.env
    });
  });
  return program2;
}
async function readHookSession(deps) {
  const isTTY = (deps.isTTY ?? process.stdin.isTTY) === true;
  const payload = isTTY ? void 0 : await (deps.read ?? readHookPayload)();
  const fields = payload !== void 0 && isJsonObject(payload) ? payload : {};
  const nonEmptyString2 = (value) => typeof value === "string" && value !== "" ? value : void 0;
  return {
    sessionId: nonEmptyString2(fields.session_id),
    hookEvent: nonEmptyString2(fields.hook_event_name)
  };
}
async function resolveSignalSessionId(flagSessionId, command, deps = {}) {
  const env = deps.env ?? process.env;
  if (env.CLAUDE_CODE_SESSION_ID ?? env.CODEX_SESSION_ID) {
    logSignalEvent("session-id-resolved", { command, source: "env" });
    return flagSessionId;
  }
  if (flagSessionId !== void 0) {
    logSignalEvent("session-id-resolved", { command, source: "flag" });
    return flagSessionId;
  }
  const { sessionId, hookEvent } = await readHookSession(deps);
  logSignalEvent("session-id-resolved", {
    command,
    source: sessionId === void 0 ? "none" : "stdin",
    hookEvent
  });
  return sessionId;
}
async function flushLinkSignals(linkStore, context, deps = {}) {
  const emitAnalytics = deps.emitAnalytics ?? emitLinkAnalytics;
  const readBranch = deps.readBranch ?? readBranchSafely;
  const emitError = deps.emitError ?? emitErrorAnalytics;
  const pending = await linkStore.listPending();
  if (!(deps.remoteLinkEnabled ?? isRemoteSessionLinkEnabled(context.env))) {
    logSignalEvent(
      "flush-paused",
      { pending: pending.length },
      context.env === void 0 ? {} : { env: context.env }
    );
    return 0;
  }
  let sentCount = 0;
  for (const link2 of pending) {
    const signalOptions = {
      agentSessionId: context.agentSessionId,
      workingDirectory: context.workingDirectory,
      issueKey: link2.issueKey,
      tenantId: link2.cloudId
    };
    const result = deps.emitSignal ? { posted: await deps.emitSignal("start", signalOptions) } : emitLocalSessionWithUpgradeReason("start", { ...signalOptions, env: context.env });
    const posted = result.posted;
    logSignalEvent("flush-link", { issueKey: link2.issueKey, cloudId: link2.cloudId, posted });
    if (deps.deferAnalytics) {
      if (posted) {
        await linkStore.markSent(link2.cloudId, link2.issueKey);
        sentCount += 1;
      }
      noteLinkSignal({ linkId: hashIdentifier(`${link2.cloudId}/${link2.issueKey}`), posted });
      continue;
    }
    if (!posted) {
      const code = result.reason?.code ?? "acps-put-failed";
      const writeback = ERROR_TABLE[code] ?? ERROR_TABLE["acps-put-failed"];
      await emitError(
        {
          agentSessionId: context.agentSessionId,
          aiErrorCode: code,
          aiErrorMessage: writeback.message,
          errorStage: writeback.stage,
          commandPath: "session signal flush"
        },
        emitOptions(context)
      );
    }
    if (posted) {
      const input = {
        agentSessionId: context.agentSessionId,
        issueId: link2.issueId,
        projectId: link2.projectId,
        tenantId: link2.cloudId,
        linkSource: resolveLinkSource(link2, () => readBranch(context.workingDirectory)),
        // The prompt is never shown once the session is linked, so reading its
        // marker here, after the link, says whether it came before it.
        ...context.sessionStore !== void 0 ? { linkPromptShown: await wasLinkPromptShown(context.sessionStore) } : {}
      };
      const analyticsPosted = context.sessionStore !== void 0 ? await emitAnalytics(input, emitOptions(context)) : await emitAnalytics(input);
      logSignalEvent("flush-analytics", { issueKey: link2.issueKey, posted: analyticsPosted });
      await linkStore.markSent(link2.cloudId, link2.issueKey);
      sentCount += 1;
    }
  }
  return sentCount;
}
async function flushSessionLink(options, stores) {
  if (options.sessionId === void 0) return void 0;
  const directory = resolveWorkingDirectory(options.env ?? process.env);
  if (directory.path === void 0) return void 0;
  let reason;
  try {
    await flushLinkSignals(
      createJiraLinkSignalStore(stores.session),
      {
        agentSessionId: options.sessionId,
        workingDirectory: directory.path,
        sessionStore: stores.session,
        queueStore: stores.plugin,
        env: options.env ?? process.env
      },
      {
        deferAnalytics: true,
        emitSignal: (operation, signalOptions) => {
          const result = emitLocalSessionWithUpgradeReason(operation, {
            ...signalOptions,
            env: options.env ?? process.env
          });
          reason ??= result.reason;
          return result.posted;
        }
      }
    );
  } catch {
  }
  return reason;
}
async function withSessionLinkResult(verdict, options, stores) {
  const reason = await flushSessionLink(options, stores);
  return reason === void 0 ? verdict : withReason(verdict, reason, "warn");
}
function deferSelf(args, options) {
  const sessionId = options.sessionId;
  const pluginDataDirectory = options.pluginDataDirectory;
  if (sessionId === void 0 || pluginDataDirectory === void 0) {
    return;
  }
  spawnDetached([...args, "--session-id", sessionId, PLUGIN_DATA_FLAG, pluginDataDirectory]);
}
function deferLinkSignalFlush(options) {
  deferSelf(["session", "signal", "flush"], options);
}
function deferSessionEndSignal(options) {
  deferSelf(["session", "signal", "end"], options);
}
async function emitLifecycle(options, stores) {
  const operation = "end";
  const sessionId = options.sessionId;
  logSignalEvent("lifecycle-invoked", { operation, sessionId });
  if (sessionId === void 0) {
    logSignalEvent("lifecycle-skipped", { operation, reason: "no-session-id" });
    return;
  }
  const directory = resolveWorkingDirectory(options.env ?? process.env);
  if (directory.deleted) noteHookAction(WORKING_DIRECTORY_MISSING);
  if (directory.path === void 0) {
    logSignalEvent("lifecycle-skipped", { operation, reason: "no-working-directory" });
    return;
  }
  await emitSessionEndSignals(
    {
      agentSessionId: sessionId,
      workingDirectory: directory.path,
      env: options.env ?? process.env
    },
    createJiraLinkSignalStore(stores.session)
  );
}
async function emitSessionEndSignals(context, linkStore, deps = {}) {
  const emitSignal = deps.emitSignal ?? emitLocalSession;
  const logOptions = context.env === void 0 ? {} : { env: context.env };
  if (!(deps.remoteLinkEnabled ?? isRemoteSessionLinkEnabled(context.env))) {
    logSignalEvent(
      "lifecycle-skipped",
      { operation: "end", reason: "remote-link-paused" },
      logOptions
    );
    return;
  }
  const recorded = await linkStore.listRecorded();
  if (recorded.length === 0) {
    logSignalEvent(
      "lifecycle-skipped",
      { operation: "end", reason: "no-recorded-link" },
      logOptions
    );
    return;
  }
  for (const link2 of recorded) {
    const posted = await emitSignal("end", {
      ...context,
      issueKey: link2.issueKey,
      tenantId: link2.cloudId
    });
    logSignalEvent(
      "lifecycle-link",
      { operation: "end", issueKey: link2.issueKey, cloudId: link2.cloudId, posted },
      logOptions
    );
  }
}
function resolveLinkSource(link2, readBranch) {
  if (link2.linkSource === void 0) {
    return "unknown";
  }
  return link2.linkSource === "workItemFetch" ? resolveFetchLinkSource(readBranch(), link2.issueKey) : link2.linkSource;
}
function readBranchSafely(workingDirectory) {
  try {
    return currentBranch(workingDirectory);
  } catch {
    return null;
  }
}
function emitOptions(context) {
  return {
    ...context.sessionStore !== void 0 ? { sessionStore: context.sessionStore } : {},
    ...context.queueStore !== void 0 ? { queueStore: context.queueStore } : {},
    ...context.env !== void 0 ? { env: context.env } : {}
  };
}

// ../../plugins/jira/src/commands/branch.ts
function registerBranchCommands(program2, options) {
  const stores = createClaudeStores(options);
  const memory = createJiraMemory(stores);
  const scope = options.sessionId !== void 0 ? "session" : "plugin";
  const branch = program2.command("branch").description("The git branch for a work item's work");
  branch.command("prepare").description(
    "Reuse the branch the tree is on, check out an existing one, or create <KEY>/<slug>; prints a verdict"
  ).requiredOption("--key <issue-key>", "Jira issue key").option(
    "--path <dir>",
    "an absolute path inside the working tree; defaults to the current directory"
  ).option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).option("--plan-only", "plan and report; write nothing").option(
    "--branch <name>",
    "the branch to use instead of <KEY>/<slug>, prefixed with the key where it does not already carry one; the item is not read"
  ).option(
    "--base <default|current|ref>",
    "where a new branch is cut from: origin/<default branch>, the current HEAD, or a ref git resolves"
  ).option("--keep-changes", "carry the pending changes onto the branch untouched").option("--stash", "stash the pending changes, tracked and untracked, before the checkout").option(
    "--worktree <dir>",
    "create the branch in a new worktree at this absolute path, leaving this tree alone"
  ).option("--no-fetch", "do not refresh origin/<default branch> before cutting a branch off it").action(async (opts, command) => {
    const verdict = await prepareBranch({
      key: opts.key,
      path: opts.path ?? process.cwd(),
      site: opts.site,
      planOnly: opts.planOnly,
      branch: opts.branch,
      base: opts.base,
      keepChanges: opts.keepChanges,
      stash: opts.stash,
      worktree: opts.worktree,
      fetch: fetchFlag(command),
      memory,
      scope
    });
    printVerdict(await withSessionLinkResult(verdict, options, stores));
  });
  branch.command("fetch-base").description(
    "Record whether this repository refreshes origin/<default branch> before a branch is cut or changes are published: off where that fetch times out, on to keep fetching and stop being asked; prints a verdict"
  ).argument("<on|off>", '"off" to skip the fetch for this repository, or "on"').option(
    "--path <dir>",
    "an absolute path inside the working tree; defaults to the current directory"
  ).action(async (value, opts) => {
    if (!isFetchPreference(value)) {
      throw new UsageError(`<on|off> must be "on" or "off", not "${value}"`);
    }
    const verdict = await setFetchBase({
      path: opts.path ?? process.cwd(),
      fetch: value,
      store: stores.plugin
    });
    printVerdict(verdict);
  });
  return program2;
}

// ../../plugins/jira/src/changes/publish.ts
import { createHash as createHash2 } from "node:crypto";
import { readFileSync as readFileSync4 } from "node:fs";

// ../../packages/gh-run/src/index.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { accessSync as accessSync3, constants as constants3 } from "node:fs";
import { delimiter as delimiter3, join as join4 } from "node:path";
var EXIT_NOT_AUTHENTICATED = 4;
var NON_INTERACTIVE_ENV = {
  GH_PROMPT_DISABLED: "1",
  GH_NO_UPDATE_NOTIFIER: "1",
  NO_COLOR: "1"
};
var GhNotFoundError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GhNotFoundError";
  }
};
function firstOnPath(command, env) {
  for (const dir of (env.PATH ?? "").split(delimiter3)) {
    if (dir === "") continue;
    const candidate = join4(dir, command);
    try {
      accessSync3(candidate, constants3.X_OK);
      return candidate;
    } catch {
    }
  }
  return void 0;
}
function resolveGhBinary(env = process.env) {
  if (env.GH_BIN) {
    try {
      accessSync3(env.GH_BIN, constants3.X_OK);
      return env.GH_BIN;
    } catch {
      throw new GhNotFoundError(`gh binary not found or not executable at GH_BIN=${env.GH_BIN}`);
    }
  }
  const found = firstOnPath("gh", env);
  if (found === void 0) {
    throw new GhNotFoundError("gh binary not found on PATH");
  }
  return found;
}
function spawnGh(binary, args, options) {
  const result = spawnSync3(binary, [...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...NON_INTERACTIVE_ENV },
    ...options.cwd !== void 0 ? { cwd: options.cwd } : {},
    ...options.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {}
  });
  if (result.error) {
    const code = result.error.code;
    if (code === "ENOENT") {
      throw new GhNotFoundError(`gh binary not found on PATH: ${binary}`);
    }
    if (code === "ETIMEDOUT") {
      return { status: null, stdout: "", stderr: "", timedOut: true };
    }
    throw result.error;
  }
  return {
    status: result.status,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
    timedOut: false
  };
}
function firstLine3(text6) {
  return text6.split("\n").map((line) => line.trim()).find((line) => line.length > 0);
}
function failureOf(spawned, timeoutMs) {
  if (spawned.timedOut) {
    return {
      ok: false,
      kind: "failed",
      status: null,
      stdout: "",
      stderr: "",
      detail: `gh timed out after ${timeoutMs ?? 0}ms`
    };
  }
  if (spawned.status === EXIT_NOT_AUTHENTICATED) {
    return {
      ok: false,
      kind: "not-authenticated",
      status: spawned.status,
      stdout: spawned.stdout,
      stderr: spawned.stderr,
      detail: firstLine3(spawned.stderr) ?? "gh is not authenticated"
    };
  }
  if (spawned.status !== 0) {
    return {
      ok: false,
      kind: "failed",
      status: spawned.status,
      stdout: spawned.stdout,
      stderr: spawned.stderr,
      detail: firstLine3(spawned.stderr) ?? firstLine3(spawned.stdout) ?? `gh exited with status ${spawned.status}`
    };
  }
  return void 0;
}
function runGhJson(binary, args, options = {}) {
  const spawned = spawnGh(binary, args, options);
  const failure = failureOf(spawned, options.timeoutMs);
  if (failure !== void 0) {
    return failure;
  }
  let parsed;
  try {
    parsed = JSON.parse(spawned.stdout);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      kind: "failed",
      status: 0,
      stdout: spawned.stdout,
      stderr: spawned.stderr,
      detail: `gh did not return JSON (${reason}): ${firstLine3(spawned.stdout) ?? ""}`
    };
  }
  return {
    ok: true,
    status: 0,
    stdout: spawned.stdout,
    stderr: spawned.stderr,
    ...isJsonValue(parsed) ? { payload: parsed } : {}
  };
}
function runGhText(binary, args, options = {}) {
  const spawned = spawnGh(binary, args, options);
  const failure = failureOf(spawned, options.timeoutMs);
  if (failure !== void 0) {
    return failure;
  }
  return { ok: true, status: 0, stdout: spawned.stdout, stderr: spawned.stderr };
}

// ../../plugins/jira/src/changes/providers/body-file.ts
import { mkdtempSync as mkdtempSync2, rmSync as rmSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { tmpdir as tmpdir2 } from "node:os";
import { join as join5 } from "node:path";
function withBodyFile(body, use) {
  const dir = mkdtempSync2(join5(tmpdir2(), "publish-changes-"));
  try {
    const file = join5(dir, "description.md");
    writeFileSync2(file, body, "utf8");
    return use(file);
  } finally {
    rmSync2(dir, { recursive: true, force: true });
  }
}

// ../../plugins/jira/src/changes/providers/bitbucket.ts
var base = (remote) => `https://bitbucket.org/${remote.workspace}/${remote.slug}`;
var branchUrl = (remote, branch) => `${base(remote)}/branch/${branch}`;
var commitUrl = (remote, sha) => `${base(remote)}/commits/${sha}`;
function pullRequestFrom(payload, remote) {
  if (payload === void 0) return void 0;
  const data = isJsonObject(payload) && payload.data !== void 0 ? payload.data : payload;
  const list = Array.isArray(data) ? data : isJsonObject(data) && Array.isArray(data.values) ? data.values : void 0;
  const record = list !== void 0 ? list[0] : data;
  if (record === void 0 || !isJsonObject(record)) return void 0;
  const id = typeof record.id === "string" || typeof record.id === "number" ? record.id : null;
  const href = isJsonObject(record.links) && isJsonObject(record.links.html) && typeof record.links.html.href === "string" ? record.links.html.href : void 0;
  const url = typeof record.url === "string" ? record.url : href ?? (id !== null ? `${base(remote)}/pull-requests/${id}` : void 0);
  if (url === void 0) return void 0;
  const repositoryUuid = destinationRepositoryUuid(record);
  return {
    id,
    url,
    title: typeof record.title === "string" ? record.title : null,
    ...repositoryUuid !== void 0 ? { repositoryUuid } : {}
  };
}
function destinationRepositoryUuid(record) {
  const destination = record.destination;
  const repository = destination !== void 0 && isJsonObject(destination) ? destination.repository : void 0;
  const uuid = repository !== void 0 && isJsonObject(repository) ? repository.uuid : void 0;
  return typeof uuid === "string" && uuid.length > 0 ? uuid.replace(/^\{|\}$/g, "") : void 0;
}
var repoArgs = (remote) => [
  "--workspace",
  remote.workspace,
  "--repo",
  remote.slug
];
function queryOpen(runner, binary, tree) {
  const query = runner(binary, [
    "bitbucket",
    "pull-requests",
    "query",
    "--source",
    tree.branch,
    "--state",
    "OPEN",
    ...repoArgs(tree.remote)
  ]);
  if (!query.ok) {
    return { ok: false, detail: query.detail ?? "twg exited non-zero" };
  }
  return { ok: true, value: pullRequestFrom(query.payload, tree.remote) };
}
function bitbucketProvider(deps) {
  const { binary, runner } = deps;
  return {
    name: "bitbucket",
    branchUrl,
    commitUrl,
    available: () => ({ ok: true }),
    findOpen: (tree) => queryOpen(runner, binary, tree),
    create: (tree, pullRequest) => {
      const created = withBodyFile(
        pullRequest.body,
        (file) => runner(binary, [
          "bitbucket",
          "pull-requests",
          "create",
          "--title",
          pullRequest.title,
          "--source",
          tree.branch,
          "--dest",
          pullRequest.dest,
          "--description-file",
          file,
          ...pullRequest.draft ? ["--draft"] : [],
          ...repoArgs(tree.remote)
        ])
      );
      if (!created.ok) {
        return { ok: false, detail: created.detail ?? "twg exited non-zero" };
      }
      const record = pullRequestFrom(created.payload, tree.remote);
      if (record !== void 0) {
        return { ok: true, value: record };
      }
      const again = queryOpen(runner, binary, tree);
      return again.ok ? { ok: true, value: again.value } : { ok: true, value: void 0 };
    }
  };
}

// ../../plugins/jira/src/changes/providers/github.ts
var repo = (remote) => `${remote.workspace}/${remote.slug}`;
var branchUrl2 = (remote, branch) => `https://github.com/${repo(remote)}/tree/${branch}`;
var commitUrl2 = (remote, sha) => `https://github.com/${repo(remote)}/commit/${sha}`;
function ghFailure(result) {
  const detail = result.detail ?? (result.stderr || "gh exited non-zero");
  return result.kind === "not-authenticated" ? { ok: false, detail, reason: "gh-not-authenticated" } : { ok: false, detail };
}
function notFound(error) {
  const why = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    reason: "gh-not-found",
    detail: `${why}; install the GitHub CLI (gh) from https://cli.github.com and sign in`
  };
}
function recordFrom(value, fallbackUrl) {
  if (value === void 0 || !isJsonObject(value)) {
    return fallbackUrl !== void 0 ? { id: null, url: fallbackUrl, title: null } : void 0;
  }
  const id = typeof value.number === "number" || typeof value.number === "string" ? value.number : null;
  const url = typeof value.url === "string" ? value.url : fallbackUrl;
  if (url === void 0) return void 0;
  return { id, url, title: typeof value.title === "string" ? value.title : null };
}
function firstOf(payload) {
  return Array.isArray(payload) ? payload[0] : void 0;
}
function githubProvider(gh) {
  return {
    name: "github",
    branchUrl: branchUrl2,
    commitUrl: commitUrl2,
    available: () => {
      let binary;
      try {
        binary = gh.resolveBinary();
      } catch (error) {
        return notFound(error);
      }
      const status = gh.runText(binary, ["auth", "status", "--hostname", "github.com"]);
      if (!status.ok) {
        return {
          ok: false,
          reason: "gh-not-authenticated",
          detail: status.stderr || status.detail || "gh is not signed in; run `gh auth login`"
        };
      }
      return { ok: true };
    },
    findOpen: (tree) => {
      let binary;
      try {
        binary = gh.resolveBinary();
      } catch (error) {
        return notFound(error);
      }
      const result = gh.runJson(binary, [
        "pr",
        "list",
        "-R",
        repo(tree.remote),
        "--head",
        tree.branch,
        "--state",
        "open",
        "--json",
        "number,url,title",
        "--limit",
        "1"
      ]);
      if (!result.ok) return ghFailure(result);
      return { ok: true, value: recordFrom(firstOf(result.payload)) };
    },
    create: (tree, pullRequest) => {
      let binary;
      try {
        binary = gh.resolveBinary();
      } catch (error) {
        return notFound(error);
      }
      const created = withBodyFile(
        pullRequest.body,
        (file) => gh.runText(binary, [
          "pr",
          "create",
          "-R",
          repo(tree.remote),
          "--head",
          tree.branch,
          "--base",
          pullRequest.dest,
          "--title",
          pullRequest.title,
          "--body-file",
          file,
          ...pullRequest.draft ? ["--draft"] : []
        ])
      );
      if (!created.ok) return ghFailure(created);
      const url = created.stdout.trim();
      if (url === "") {
        return { ok: false, detail: "gh pr create printed no pull request URL" };
      }
      const viewed = gh.runJson(binary, ["pr", "view", url, "--json", "number,url,title"]);
      return {
        ok: true,
        value: viewed.ok ? recordFrom(viewed.payload, url) : { id: null, url, title: null }
      };
    }
  };
}

// ../../plugins/jira/src/changes/providers/providers.ts
function providerFor(remote, deps) {
  if (remote.provider === "bitbucket") {
    return bitbucketProvider(deps);
  }
  if (remote.provider === "github") {
    return githubProvider(deps.gh);
  }
  return void 0;
}

// ../../plugins/jira/src/panels/publish.ts
function link(label, url) {
  return url ? `[${label}](${url})` : label;
}
function publishLines(applied, { branchUrl: branchUrl3, itemUrl: itemUrl2 } = {}) {
  const lines = [];
  for (const entry of applied) {
    if (!entry.ok) {
      continue;
    }
    switch (entry.step) {
      case "push": {
        const branch = entry.branch ?? "";
        if (branch) {
          lines.push(`**Pushed:** ${link(branch, branchUrl3?.(branch))}`);
        }
        break;
      }
      case "pull-request": {
        if (entry.action !== "create" || !entry.url) {
          break;
        }
        const label = entry.id !== null && entry.id !== void 0 ? `#${entry.id}` : entry.url;
        lines.push(`**Pull request:** ${link(label, entry.url)}`);
        break;
      }
      case "comment": {
        const id = entry.id ?? null;
        const label = id === null ? "comment" : `comment ${id}`;
        const url = itemUrl2 && id !== null ? `${itemUrl2}?focusedCommentId=${id}` : void 0;
        lines.push(`**Summary posted:** ${link(label, url)}`);
        break;
      }
      case "transition":
        lines.push(`**Transitioned:** ${entry.from ?? ""} \u2192 ${entry.to ?? ""}`);
        break;
    }
  }
  return lines.join("\n");
}

// ../../plugins/jira/src/storage/review-preview.ts
var SHA256_HEX = /^[0-9a-f]{64}$/;
var digestOf = (value) => typeof value === "string" && SHA256_HEX.test(value) ? value : void 0;
var reviewPreviewCodec = {
  version: 1,
  encode: (preview) => ({
    ...preview.comment !== void 0 ? { comment: preview.comment } : {},
    ...preview.pullRequest !== void 0 ? { pullRequest: preview.pullRequest } : {}
  }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const comment = digestOf(value.comment);
    const pullRequest = digestOf(value.pullRequest);
    return {
      ...comment !== void 0 ? { comment } : {},
      ...pullRequest !== void 0 ? { pullRequest } : {}
    };
  }
};
var jiraReviewPreviewKeys = {
  preview(cloudId, issueKey) {
    return defineStorageKey(
      `jira/review-previews/${encodeURIComponent(cloudId)}/${encodeURIComponent(issueKey)}`,
      reviewPreviewCodec
    );
  }
};
function createJiraReviewPreviewStore(store) {
  return {
    getReviewPreview: (cloudId, issueKey) => store.get(jiraReviewPreviewKeys.preview(cloudId, issueKey)),
    setReviewPreview: (cloudId, issueKey, preview) => store.set(jiraReviewPreviewKeys.preview(cloudId, issueKey), preview)
  };
}

// ../../plugins/jira/src/storage/review-preferences.ts
var REVIEW_BODIES = ["comment", "pull-request"];
var DEFAULT_REVIEW_PREFERENCES = { comment: "ask", pullRequest: "ask" };
function isReviewPreference(value) {
  return value === "skip" || value === "ask";
}
function isReviewBody(value) {
  return REVIEW_BODIES.includes(value);
}
var preferenceOf = (value) => isReviewPreference(value) ? value : "ask";
var reviewPreferencesCodec = {
  version: 1,
  encode: (value) => ({ comment: value.comment, pullRequest: value.pullRequest }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    return { comment: preferenceOf(value.comment), pullRequest: preferenceOf(value.pullRequest) };
  }
};
var reviewPreferencesKey = defineStorageKey(
  "jira/review-preferences",
  reviewPreferencesCodec
);
async function getReviewPreferences(store) {
  return await store.get(reviewPreferencesKey) ?? DEFAULT_REVIEW_PREFERENCES;
}
async function setReviewPreference(store, body, preference) {
  const current = await getReviewPreferences(store);
  const next = body === "comment" ? { ...current, comment: preference } : { ...current, pullRequest: preference };
  await store.set(reviewPreferencesKey, next);
  return next;
}

// ../../plugins/jira/src/storage/publish-verdict.ts
var PUBLISH_CHANGES_SCHEMA = "jira-workflows/publish-changes/v1";
var STATUSES2 = /* @__PURE__ */ new Set(["pass", "warn", "fail"]);
var jiraPublishVerdictCodec = {
  version: 1,
  encode: (value) => value,
  decode: (value) => {
    if (!isJsonObject(value) || value.schema !== PUBLISH_CHANGES_SCHEMA || typeof value.status !== "string" || !STATUSES2.has(value.status) || !Array.isArray(value.reasons)) {
      return void 0;
    }
    return value;
  }
};
var jiraPublishVerdictKeys = {
  verdict(cloudId, issueKey) {
    return defineStorageKey(
      `jira/publish-verdicts/${encodeURIComponent(cloudId)}/${encodeURIComponent(issueKey)}`,
      jiraPublishVerdictCodec
    );
  }
};
function createJiraPublishVerdictStore(store) {
  return {
    getPublishVerdict: (cloudId, issueKey) => store.get(jiraPublishVerdictKeys.verdict(cloudId, issueKey)),
    setPublishVerdict: (cloudId, issueKey, verdict) => store.set(jiraPublishVerdictKeys.verdict(cloudId, issueKey), verdict)
  };
}

// ../../plugins/jira/src/template/facts.ts
var ITEM = ["key", "item.summary", "item.url"];
var PULL_REQUEST = ["pullRequest.url", "pullRequest.label", "pullRequest.link"];
var TREE = [
  "branch.name",
  "branch.url",
  "branch.link",
  "commit.short",
  "commit.url",
  "commit.link",
  "commits"
];
var FACTS = {
  "work-item": [],
  comment: [...ITEM, ...PULL_REQUEST, ...TREE],
  "pull-request": [...ITEM, ...TREE]
};
var SHORT_SHA = 7;
function itemFacts(item) {
  return {
    key: item.key,
    "item.summary": String(item.summary ?? item.key).trim(),
    "item.url": item.url ?? ""
  };
}
function pullRequestFacts(pullRequest, skipDetail) {
  if (pullRequest === null) {
    return {
      "pullRequest.url": "",
      "pullRequest.label": "",
      "pullRequest.link": skipDetail === void 0 ? "" : `not opened (${skipDetail})`
    };
  }
  const label = pullRequest.title || (pullRequest.id !== null ? `#${pullRequest.id}` : pullRequest.url);
  return {
    "pullRequest.url": pullRequest.url,
    "pullRequest.label": label,
    "pullRequest.link": `[${label}](${pullRequest.url})`
  };
}
function commitList(commits) {
  return commits.flatMap((commit) => [
    `- ${commit.sha.slice(0, SHORT_SHA)} ${commit.subject}`,
    ...commit.body ? commit.body.split("\n").map((line) => line.trim() ? `  ${line}` : "") : []
  ]).join("\n");
}
function treeFacts(remote, branch, commits, host) {
  const latest = commits[0];
  const short = latest === void 0 ? "" : latest.sha.slice(0, SHORT_SHA);
  const branchUrl3 = host === null ? "" : host.branchUrl(remote, branch);
  const commitUrl3 = host === null || latest === void 0 ? "" : host.commitUrl(remote, latest.sha);
  return {
    "branch.name": branch,
    "branch.url": branchUrl3,
    // Plain text where the host has no provider, so there is no address to link.
    "branch.link": branchUrl3 === "" ? branch : `[${branch}](${branchUrl3})`,
    "commit.short": short,
    "commit.url": commitUrl3,
    "commit.link": commitUrl3 === "" ? short : `[${short}](${commitUrl3})`,
    commits: commitList(commits)
  };
}

// ../../node_modules/.pnpm/marked@18.1.0/node_modules/marked/lib/marked.esm.js
function I() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var P = I();
function W(l3) {
  P = l3;
}
var A = { exec: () => null };
function C(l3) {
  let e = [];
  return (t) => {
    let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
    return s || (s = l3(n), e[n] = s), s;
  };
}
function h(l3, e = "") {
  let t = typeof l3 == "string" ? l3 : l3.source, n = { replace: (s, r) => {
    let o = typeof r == "string" ? r : r.source;
    return o = o.replace(x.caret, "$1"), t = t.replace(s, o), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var _e = ((l3 = "") => {
  try {
    return !!new RegExp("(?<=1)(?<!1)" + l3);
  } catch {
    return false;
  }
})();
var x = { codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, endingSpaceTabChar: /[ \t]$/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, leadingSpaceTab: /^[ \t]+/, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/g, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l3) => new RegExp(`^( {0,3}${l3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: C((l3) => new RegExp(`^ {0,${l3}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: C((l3) => new RegExp(`^ {0,${l3}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)), fencesBeginRegex: C((l3) => new RegExp(`^ {0,${l3}}(?:\`\`\`|~~~)`)), headingBeginRegex: C((l3) => new RegExp(`^ {0,${l3}}#`)), htmlBeginRegex: C((l3) => new RegExp(`^ {0,${l3}}(?:</?(?:${N})(?: +|$|/?>)|<(?:script|pre|style|textarea|!--))`, "i")), blockquoteBeginRegex: C((l3) => new RegExp(`^ {0,${l3}}>`)) };
var $e = /^(?:[ \t]*(?:\n|$))+/;
var Le = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var ze = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var G = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Ae = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var J = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var he = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var de = h(he).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Ee = h(he).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var V = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
var Me = /^[^\n]+/;
var Y = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var Ie = h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Y).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var Ce = h(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, J).getRegex();
var N = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var ee = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Be = h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", ee).replace("tag", N).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var ke = (l3) => h(V).replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", l3).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex();
var De = ke(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
var qe = ke(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/);
var ve = h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", qe).getRegex();
var te = { blockquote: ve, code: Le, def: Ie, fences: ze, heading: Ae, hr: G, html: Be, lheading: de, list: Ce, newline: $e, paragraph: De, table: A, text: Me };
var ue = h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex();
var Ze = { ...te, lheading: Ee, table: ue, paragraph: h(V).replace("hr", G).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ue).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex() };
var He = { ...te, html: h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", ee).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: A, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: h(V).replace("hr", G).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", de).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Ge = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var Ne = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var ge = /^( {2,}|\\)\n(?!\s*$)[ \t]*/;
var Qe = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var $ = /[\p{P}\p{S}]/u;
var B = /[\s\p{P}\p{S}]/u;
var Q = /[^\s\p{P}\p{S}]/u;
var je = h(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, B).getRegex();
var Fe = /[\p{Pi}\p{Ps}"']/u;
var fe = /(?!~)[\p{P}\p{S}]/u;
var Ue = /(?!~)[\s\p{P}\p{S}]/u;
var Ke = /(?:[^\s\p{P}\p{S}]|~)/u;
var We = h(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", _e ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var me = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var Xe = h(me, "u").replace(/punct/g, $).getRegex();
var Je = h(me, "u").replace(/punct/g, fe).getRegex();
var Ve = /^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/;
var Ye = h(Ve, "u").replace(/openQuote/g, Fe).replace(/punct/g, $).getRegex();
var xe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var et = h(xe, "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var tt = h(xe, "gu").replace(/notPunctSpace/g, Ke).replace(/punctSpace/g, Ue).replace(/punct/g, fe).getRegex();
var nt = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)";
var rt = h(nt, "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var st = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var it = "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)";
var ot = h(it, "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var at = h(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, $).getRegex();
var lt = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
var ut = h(lt, "gu").replace(/notPunctSpace/g, Q).replace(/punctSpace/g, B).replace(/punct/g, $).getRegex();
var pt = h(/\\(punct)/, "gu").replace(/punct/g, $).getRegex();
var ct = h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var ht = h(ee).replace("(?:-->|$)", "-->").getRegex();
var dt = h("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ht).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var be = /\[(?:\\[\s\S]|[^\[\]\\])*\]/;
var U = h(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets", be).getRegex();
var kt = h(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace("label", U).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var gt = h(/^!?\[(label)\]\[(ref)\]/).replace("label", U).replace("ref", Y).getRegex();
var ft = h(/^!?\[(ref)\](?:\[\])?/).replace("ref", Y).getRegex();
var pe = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/;
var mt = h(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets", be).getRegex();
var xt = h("reflink|nolink(?!\\()", "g").replace("reflink", h(/^!?\[(label)\]\[(ref)\]/).replace("label", mt).replace("ref", pe).getRegex()).replace("nolink", h(/^!?\[(ref)\](?:\[\])?/).replace("ref", pe).getRegex()).getRegex();
var ce = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var bt = /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/;
var Rt = h(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g, bt).getRegex();
var ne = { _backpedal: A, anyPunctuation: pt, autolink: ct, blockSkip: We, br: ge, code: Ne, del: A, delLDelim: A, delRDelim: A, emStrongLDelim: Xe, emStrongRDelimAst: et, emStrongRDelimUnd: st, escape: Ge, link: kt, nolink: ft, punctuation: je, reflink: gt, reflinkSearch: xt, tag: dt, text: Qe, url: A };
var Tt = { ...ne, emStrongLDelim: Ye, emStrongRDelimAst: rt, emStrongRDelimUnd: ot, link: h(/^!?\[(label)\]\((.*?)\)/).replace("label", U).getRegex(), reflink: h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U).getRegex() };
var X = { ...ne, emStrongRDelimAst: tt, emStrongLDelim: Je, delLDelim: at, delRDelim: ut, url: h(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol", Rt).replace("protocol", ce).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: h(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol", ce).replace(/emailProtocol/g, /(?:mailto|xmpp):/).getRegex() };
var Ot = { ...X, br: h(ge).replace("{2,}", "*").getRegex(), text: h(X.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var j = { normal: te, gfm: Ze, pedantic: He };
var D = { normal: ne, gfm: X, breaks: Ot, pedantic: Tt };
var wt = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var Re = (l3) => wt[l3];
function O(l3, e) {
  if (e) {
    if (x.escapeTest.test(l3)) return l3.replace(x.escapeReplace, Re);
  } else if (x.escapeTestNoEncode.test(l3)) return l3.replace(x.escapeReplaceNoEncode, Re);
  return l3;
}
function Te(l3) {
  return l3.replace(x.numericCharacterReference, (e, t, n) => {
    let s = t === void 0 ? Number.parseInt(n, 16) : Number.parseInt(t, 10);
    return s === 0 || s > 1114111 || s >= 55296 && s <= 57343 ? "\uFFFD" : String.fromCodePoint(s);
  });
}
function re(l3) {
  try {
    l3 = encodeURI(l3).replace(x.percentDecode, "%");
  } catch {
    return null;
  }
  return l3;
}
function se(l3, e) {
  let t = l3.replace(x.findPipe, (r, o, i) => {
    let u = false, a = o;
    for (; --a >= 0 && i[a] === "\\"; ) u = !u;
    return u ? "|" : " |";
  }), n = t.split(x.splitPipe), s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; s < n.length; s++) n[s] = n[s].trim().replace(x.slashPipe, "|");
  return n;
}
function L(l3, e, t) {
  let n = l3.length;
  if (n === 0) return "";
  let s = 0;
  for (; s < n; ) {
    let r = l3.charAt(n - s - 1);
    if (r === e && !t) s++;
    else if (r !== e && t) s++;
    else break;
  }
  return l3.slice(0, n - s);
}
function ie(l3) {
  let e = l3.split(`
`), t = e.length - 1;
  for (; t >= 0 && x.blankLine.test(e[t]); ) t--;
  return e.length - t <= 2 ? l3 : e.slice(0, t + 1).join(`
`);
}
function q(l3) {
  return l3.trim().toLowerCase().toUpperCase().toLowerCase();
}
function oe(l3, e) {
  if (l3.indexOf(e[0]) === -1 && l3.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < l3.length; n++) if (l3[n] === "\\") n++;
  else if (l3[n] === e[0]) t++;
  else if (l3[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function ae(l3, e = 0) {
  let t = e, n = "";
  for (let s of l3) if (s === "	") {
    let r = 4 - t % 4;
    n += " ".repeat(r), t += r;
  } else n += s, t++;
  return n;
}
function Oe(l3, e, t, n, s) {
  let r = e.href, o = e.title || null, i = l3[1].replace(s.other.outputLinkReplace, "$1"), u = l3[0].charAt(0) === "!";
  n.state.inLink = true;
  let a = n.state.linkEmitted, p = n.state.inRawBlock;
  n.state.linkEmitted = false;
  let c = n.inlineTokens(i), d = n.state.linkEmitted;
  if (n.state.linkEmitted = a, n.state.inLink = false, !u) {
    if (d) {
      n.state.inRawBlock = p;
      return;
    }
    n.state.linkEmitted = true;
  }
  return { type: u ? "image" : "link", raw: t, href: r, title: o, text: i, tokens: c };
}
function Pt(l3, e, t) {
  let n = l3.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let s = n[1];
  return e.split(`
`).map((r) => {
    let o = r.match(t.other.beginningSpace);
    if (o === null) return r;
    let [i] = o;
    return r.slice(Math.min(i.length, s.length));
  }).join(`
`);
}
function we(l3, e, t, n) {
  if (!e.includes("<")) return false;
  for (let s = 0; s < e.length; s++) {
    if (e[s] === "\\") {
      s++;
      continue;
    }
    if (e[s] === "`") {
      let i = n.inline.code.exec(e.slice(s));
      if (i) {
        s += i[0].length - 1;
        continue;
      }
    }
    if (e[s] !== "<") continue;
    let r = l3.slice(t + s), o = n.inline.tag.exec(r) || n.inline.autolink.exec(r);
    if (o) {
      if (o[0].length > e.length - s) return true;
      s += o[0].length - 1;
    }
  }
  return false;
}
var y = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || P;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = this.options.pedantic ? t[0] : ie(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], s = Pt(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let s = L(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceTabChar.test(s)) && (n = s.trim());
      }
      return { type: "heading", raw: L(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return { type: "hr", raw: L(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = L(t[0], `
`).split(`
`), s = "", r = "", o = [];
      for (; n.length > 0; ) {
        let i = false, u = [], a;
        for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) u.push(n[a]), i = true;
        else if (!i) u.push(n[a]);
        else break;
        n = n.slice(a);
        let p = u.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${p}` : p, r = r ? `${r}
${c}` : c;
        let d = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(c, o, true), this.lexer.state.top = d, n.length === 0) break;
        let m = o.at(-1);
        if (m?.type === "code") break;
        if (m?.type === "blockquote") {
          let b = m, g = n.join(`
`), w = b.raw + `
` + g.replace(this.rules.other.blockquoteSetextReplace2, ""), f = this.blockquote(w);
          o[o.length - 1] = f;
          let M = w.substring(f.raw.length).replace(/^\n/, ""), v = M ? M.split(`
`).length : 0, Z = v ? n.slice(0, -v) : n;
          Z.length > 0 && (s = `${s}
${Z.join(`
`)}`), r = r.substring(0, r.length - b.text.length) + f.text;
          break;
        } else if (m?.type === "list") {
          let b = m, g = b.raw + `
` + n.join(`
`), w = this.list(g);
          o[o.length - 1] = w, s = s.substring(0, s.length - m.raw.length) + w.raw, r = r.substring(0, r.length - b.raw.length) + w.raw, n = g.substring(o.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: s, tokens: o, text: r };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      let o = this.rules.other.listItemRegex(n), i = false;
      for (; e; ) {
        let a = false, p = "", c = "";
        if (!(t = o.exec(e)) || this.rules.block.hr.test(e)) break;
        p = t[0], e = e.substring(p.length);
        let d = t[2].split(`
`, 1)[0], m = t[1].length, b = this.options.pedantic ? ae(d, m) : d.replace(this.rules.other.leadingSpaceTab, (M) => ae(M, m)), g = e.split(`
`, 1)[0], w = !b.trim(), f = 0;
        if (this.options.pedantic ? (f = 2, c = b.trimStart()) : w ? f = m + 1 : (f = b.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = b.slice(f), f += m), w && this.rules.other.blankLine.test(g) && (p += g + `
`, e = e.substring(g.length + 1), a = true), !a) {
          let M = this.rules.other.nextBulletRegex(f), v = this.rules.other.hrRegex(f), Z = this.rules.other.fencesBeginRegex(f), le = this.rules.other.headingBeginRegex(f), Pe = this.rules.other.htmlBeginRegex(f), ye = this.rules.other.blockquoteBeginRegex(f);
          for (; e; ) {
            let K = e.split(`
`, 1)[0], H;
            if (g = K, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), H = g) : H = g.replace(this.rules.other.leadingSpaceTab, (Se) => Se.replace(this.rules.other.tabCharGlobal, "    ")), Z.test(g) || le.test(g) || Pe.test(g) || ye.test(g) || M.test(g) || v.test(g)) break;
            if (H.search(this.rules.other.nonSpaceChar) >= f || !g.trim()) c += `
` + H.slice(f);
            else {
              if (w || b.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Z.test(b) || le.test(b) || v.test(b)) break;
              c += `
` + g;
            }
            w = !g.trim(), p += K + `
`, e = e.substring(K.length + 1), b = H.slice(f);
          }
        }
        r.loose || (i ? r.loose = true : this.rules.other.doubleBlankLine.test(p) && (i = true)), r.items.push({ type: "list_item", raw: p, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: false, text: c, tokens: [] }), r.raw += p;
      }
      let u = r.items.at(-1);
      if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
      else return;
      r.raw = r.raw.trimEnd();
      for (let a of r.items) if (this.lexer.state.top = false, a.tokens = this.lexer.blockTokens(a.text, []), !r.loose) {
        let p = a.tokens.filter((d) => d.type === "space"), c = p.length > 0 && p.some((d) => this.rules.other.anyLine.test(d.raw));
        r.loose = c;
      }
      for (let a of r.items) {
        let p = a.tokens[0];
        if (a.task && (p?.type === "text" || p?.type === "paragraph")) {
          a.text = a.text.replace(this.rules.other.listReplaceTask, ""), p.raw = p.raw.replace(this.rules.other.listReplaceTask, ""), p.text = p.text.replace(this.rules.other.listReplaceTask, "");
          for (let d = this.lexer.inlineQueue.length - 1; d >= 0; d--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[d].src)) {
            this.lexer.inlineQueue[d].src = this.lexer.inlineQueue[d].src.replace(this.rules.other.listReplaceTask, "");
            break;
          }
          let c = this.rules.other.listTaskCheckbox.exec(a.raw);
          if (c) {
            let d = { type: "checkbox", raw: c[0] + " ", checked: c[0] !== "[ ]" };
            a.checked = d.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = d.raw + a.tokens[0].raw, a.tokens[0].text = d.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(d)) : a.tokens.unshift({ type: "paragraph", raw: d.raw, text: d.raw, tokens: [d] }) : a.tokens.unshift(d);
          }
        } else a.task && (a.task = false);
      }
      if (r.loose) for (let a of r.items) {
        a.loose = true;
        for (let p of a.tokens) p.type === "text" && (p.type = "paragraph");
      }
      return r;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) {
      let n = ie(t[0]);
      return { type: "html", block: true, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
    }
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      if (!this.rules.other.startAngleBracket.test(t[2]) && oe(t[2], "()") !== -1) return;
      let n = q(t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: L(t[0], `
`), href: s, title: r };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = se(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], o = { type: "table", raw: L(t[0], `
`), header: [], align: [], rows: [] };
    if (n.length === s.length) {
      for (let i of s) this.rules.other.tableAlignRight.test(i) ? o.align.push("right") : this.rules.other.tableAlignCenter.test(i) ? o.align.push("center") : this.rules.other.tableAlignLeft.test(i) ? o.align.push("left") : o.align.push(null);
      for (let i = 0; i < n.length; i++) o.header.push({ text: n[i], tokens: this.lexer.inline(n[i]), header: true, align: o.align[i] });
      for (let i of r) o.rows.push(se(i, o.header.length).map((u, a) => ({ text: u, tokens: this.lexer.inline(u), header: false, align: o.align[a] })));
      return o;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) {
      let n = t[1].trim();
      return { type: "heading", raw: L(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
    }
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    if (this.lexer.state.linkParenPossible === false) return;
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[0].charAt(0) === "!" ? 2 : 1;
      if (!this.options.pedantic && we(e, t[1], n, this.rules)) return;
      let s = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(s)) {
        if (!this.rules.other.endAngleBracket.test(s)) return;
        let i = L(s.slice(0, -1), "\\");
        if ((s.length - i.length) % 2 === 0) return;
      } else {
        let i = oe(t[2], "()");
        if (i === -2) return;
        if (i > -1) {
          let a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
          t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, a).trim(), t[3] = "";
        }
      }
      let r = t[2], o = "";
      if (this.options.pedantic) {
        let i = this.rules.other.pedanticHrefTitle.exec(r);
        i && (r = i[1], o = i[3]);
      } else o = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(s) ? r = r.slice(1) : r = r.slice(1, -1)), Oe(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: o && o.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let s = n[0].charAt(0) === "!" ? 2 : 1;
      if (!this.options.pedantic && we(e, n[1], s, this.rules)) return;
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), o = t[q(r)];
      if (!o) {
        let i = n[0].charAt(0);
        return { type: "text", raw: i, text: i };
      }
      return Oe(n, o, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let o = [...s[0]].length - 1, i, u, a = o, p = 0, c = s[0][0], d = n === c, m = c === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (m.lastIndex = 0, t = t.slice(-1 * e.length + o); (s = m.exec(t)) !== null; ) {
        if (i = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !i) continue;
        if (u = [...i].length, s[3] || s[4]) {
          a += u;
          continue;
        } else if (s[5] || s[6]) {
          if (o % 3 && !((o + u) % 3)) {
            p += u;
            continue;
          }
          if (d) break;
        }
        if (a -= u, a > 0) continue;
        u = Math.min(u, u + a + p);
        let b = [...s[0]][0].length, g = e.slice(0, o + s.index + b + u);
        if (Math.min(o, u) % 2) {
          let f = g.slice(1, -1);
          return { type: "em", raw: g, text: f, tokens: this.lexer.inlineTokens(f) };
        }
        let w = g.slice(2, -2);
        return { type: "strong", raw: g, text: w, tokens: this.lexer.inlineTokens(w) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return { type: "br", raw: t[0] };
  }
  del(e, t, n = "") {
    let s = this.rules.inline.delLDelim.exec(e);
    if (!s) return;
    if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let o = [...s[0]].length - 1, i, u, a = o, p = this.rules.inline.delRDelim;
      for (p.lastIndex = 0, t = t.slice(-1 * e.length + o); (s = p.exec(t)) !== null; ) {
        if (i = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !i || (u = [...i].length, u !== o)) continue;
        if (s[3] || s[4]) {
          a += u;
          continue;
        }
        if (a -= u, a > 0) continue;
        u = Math.min(u, u + a);
        let c = [...s[0]][0].length, d = e.slice(0, o + s.index + c + u), m = d.slice(o, -o);
        return { type: "del", raw: d, text: m, tokens: this.lexer.inlineTokens(m) };
      }
    }
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, autolink: true, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, s;
      if (t[2] === "@") n = t[0], s = "mailto:" + n;
      else {
        let r;
        do
          r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (r !== t[0]);
        n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: s, autolink: true, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: n ? t[0] : Te(t[0]), escaped: n };
    }
  }
};
var R = class l {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || P, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, linkEmitted: false, linkParenPossible: true, top: true };
    let t = { other: x, block: j.normal, inline: D.normal };
    this.options.pedantic ? (t.block = j.pedantic, t.inline = D.pedantic) : this.options.gfm && (t.block = j.gfm, this.options.breaks ? t.inline = D.breaks : t.inline = D.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: j, inline: D };
  }
  static lex(e, t) {
    return new l(t).lex(e);
  }
  static lexInline(e, t) {
    return new l(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(x.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(x.tabCharGlobal, "    ").replace(x.spaceLine, ""));
    let s = 1 / 0;
    for (; e; ) {
      if (e.length < s) s = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      let r;
      if (this.options.extensions?.block?.some((i) => (r = i.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let i = t.at(-1);
        r.raw.length === 1 && i !== void 0 ? i.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let i = t.at(-1);
        i?.type === "paragraph" || i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.at(-1).src = i.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let i = t.at(-1);
        i?.type === "paragraph" || i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.raw, this.inlineQueue.at(-1).src = i.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let o = e;
      if (this.options.extensions?.startBlock) {
        let i = 1 / 0, u = e.slice(1), a;
        this.options.extensions.startBlock.forEach((p) => {
          a = p.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (i = Math.min(i, a));
        }), i < 1 / 0 && i >= 0 && (o = e.substring(0, i + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(o))) {
        let i = t.at(-1);
        n && i?.type === "paragraph" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = i.text) : t.push(r), n = o.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let i = t.at(-1);
        i?.type === "text" ? (i.raw += (i.raw.endsWith(`
`) ? "" : `
`) + r.raw, i.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = i.text) : t.push(r);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  linkInText(e) {
    if (!e.includes("[")) return false;
    let t = this.tokenizer.rules.inline.link;
    for (let n of e.matchAll(this.tokenizer.rules.inline.blockSkip)) if (t.test(n[0]) && e.charAt(n.index - 1) !== "!") return true;
    for (let n of e.matchAll(this.tokenizer.rules.inline.reflinkSearch)) {
      let s = n[0], r = s.lastIndexOf("[");
      if (!(s.charAt(0) === "!" || !Object.hasOwn(this.tokens.links, q(s.slice(r + 1, -1)))) && !(r > 1 && this.linkInText(s.slice(1, r - 1)))) return true;
    }
    return false;
  }
  inlineTokens(e, t = []) {
    this.tokenizer.lexer = this;
    let n = this.state.linkParenPossible;
    this.state.linkParenPossible = n && e.includes(")");
    try {
      return this.#e(e, t);
    } finally {
      this.state.linkParenPossible = n;
    }
  }
  #e(e, t) {
    let n = e;
    if (this.tokens.links && e.includes("[")) {
      let i = this.tokenizer.rules.inline.reflinkSearch, u = (a) => {
        let p = a.lastIndexOf("[");
        if (!Object.hasOwn(this.tokens.links, q(a.slice(p + 1, -1)))) return a;
        if (p > 1 && a.charAt(0) !== "!") {
          let c = a.slice(1, p - 1);
          if (this.linkInText(c)) return "[" + c.replace(i, u) + "][" + "a".repeat(a.length - p - 2) + "]";
        }
        return "[" + "a".repeat(a.length - 2) + "]";
      };
      n = n.replace(i, u);
    }
    n = n.replace(this.tokenizer.rules.inline.anyPunctuation, (i) => "+".repeat(i.length)), n = n.replace(this.tokenizer.rules.inline.blockSkip, (i, u, a) => {
      let p = a ? a.length : 0;
      return i.slice(0, p) + "[" + "a".repeat(i.length - p - 2) + "]";
    }), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let s = false, r = "", o = 1 / 0;
    for (; e; ) {
      if (e.length < o) o = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      s || (r = ""), s = false;
      let i;
      if (this.options.extensions?.inline?.some((a) => (i = a.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), true) : false)) continue;
      if (i = this.tokenizer.escape(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.tag(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.link(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(i.raw.length);
        let a = t.at(-1);
        i.type === "text" && a?.type === "text" ? (a.raw += i.raw, a.text += i.text) : t.push(i);
        continue;
      }
      if (i = this.tokenizer.emStrong(e, n, r)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.codespan(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.br(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.del(e, n, r)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.autolink(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (!this.state.inLink && (i = this.tokenizer.url(e))) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      let u = e;
      if (this.options.extensions?.startInline) {
        let a = 1 / 0, p = e.slice(1), c;
        this.options.extensions.startInline.forEach((d) => {
          c = d.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
        }), a < 1 / 0 && a >= 0 && (u = e.substring(0, a + 1));
      }
      if (i = this.tokenizer.inlineText(u)) {
        e = e.substring(i.raw.length), i.raw.slice(-1) !== "_" && (r = i.raw.slice(-1)), s = true;
        let a = t.at(-1);
        a?.type === "text" ? (a.raw += i.raw, a.text += i.text) : t.push(i);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return t;
  }
  infiniteLoopError(e) {
    let t = "Infinite loop on byte: " + e;
    if (this.options.silent) console.error(t);
    else throw new Error(t);
  }
};
var S = class {
  options;
  parser;
  constructor(e) {
    this.options = e || P;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let s = (t || "").match(x.notSpaceStart)?.[0], r = e ? e.replace(x.endingNewline, "") + `
` : "";
    return s ? '<pre><code class="language-' + O(s) + '">' + (n ? r : O(r, true)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered, n = e.start, s = "";
    for (let i = 0; i < e.items.length; i++) {
      let u = e.items[i];
      s += this.listitem(u);
    }
    let r = t ? "ol" : "ul", o = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + r + o + `>
` + s + "</" + r + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let r = 0; r < e.rows.length; r++) {
      let o = e.rows[r];
      n = "";
      for (let i = 0; i < o.length; i++) n += this.tablecell(o[i]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${O(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, text: n, tokens: s, autolink: r }) {
    let o = r ? O(n, true) : this.parser.parseInline(s), i = re(e);
    if (i === null) return o;
    e = O(i, r);
    let u = '<a href="' + e + '"';
    return t && (u += ' title="' + O(t) + '"'), u += ">" + o + "</a>", u;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    let r = re(e);
    if (r === null) return O(n);
    e = r;
    let o = `<img src="${O(e)}" alt="${O(n)}"`;
    return t && (o += ` title="${O(t)}"`), o += ">", o;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
  }
};
var z = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var T = class l2 {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || P, this.options.renderer = this.options.renderer || new S(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new z();
  }
  static parse(e, t) {
    return new l2(t).parse(e);
  }
  static parseInline(e, t) {
    return new l2(t).parseInline(e);
  }
  parse(e) {
    this.renderer.parser = this;
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let s = e[n];
      if (this.options.extensions?.renderers?.[s.type]) {
        let o = s, i = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (i !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "checkbox", "html", "def", "paragraph", "text"].includes(o.type)) {
          t += i || "";
          continue;
        }
      }
      let r = s;
      switch (r.type) {
        case "space": {
          t += this.renderer.space(r);
          break;
        }
        case "hr": {
          t += this.renderer.hr(r);
          break;
        }
        case "heading": {
          t += this.renderer.heading(r);
          break;
        }
        case "code": {
          t += this.renderer.code(r);
          break;
        }
        case "table": {
          t += this.renderer.table(r);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(r);
          break;
        }
        case "list": {
          t += this.renderer.list(r);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(r);
          break;
        }
        case "html": {
          t += this.renderer.html(r);
          break;
        }
        case "def": {
          t += this.renderer.def(r);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(r);
          break;
        }
        case "text": {
          t += this.renderer.text(r);
          break;
        }
        default: {
          let o = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent) return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    this.renderer.parser = this;
    let n = "";
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (this.options.extensions?.renderers?.[r.type]) {
        let i = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (i !== false || !["escape", "html", "link", "image", "checkbox", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          n += i || "";
          continue;
        }
      }
      let o = r;
      switch (o.type) {
        case "escape": {
          n += t.text(o);
          break;
        }
        case "html": {
          n += t.html(o);
          break;
        }
        case "link": {
          n += t.link(o);
          break;
        }
        case "image": {
          n += t.image(o);
          break;
        }
        case "checkbox": {
          n += t.checkbox(o);
          break;
        }
        case "strong": {
          n += t.strong(o);
          break;
        }
        case "em": {
          n += t.em(o);
          break;
        }
        case "codespan": {
          n += t.codespan(o);
          break;
        }
        case "br": {
          n += t.br(o);
          break;
        }
        case "del": {
          n += t.del(o);
          break;
        }
        case "text": {
          n += t.text(o);
          break;
        }
        default: {
          let i = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent) return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return n;
  }
};
var _ = class {
  options;
  block;
  constructor(e) {
    this.options = e || P;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer(e = this.block) {
    return e ? R.lex : R.lexInline;
  }
  provideParser(e = this.block) {
    return e ? T.parse : T.parseInline;
  }
};
var F = class {
  defaults = I();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = T;
  Renderer = S;
  TextRenderer = z;
  Lexer = R;
  Tokenizer = y;
  Hooks = _;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
      case "table": {
        let r = s;
        for (let o of r.header) n = n.concat(this.walkTokens(o.tokens, t));
        for (let o of r.rows) for (let i of o) n = n.concat(this.walkTokens(i.tokens, t));
        break;
      }
      case "list": {
        let r = s;
        n = n.concat(this.walkTokens(r.items, t));
        break;
      }
      default: {
        let r = s;
        this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((o) => {
          let i = r[o].flat(1 / 0);
          n = n.concat(this.walkTokens(i, t));
        }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
      }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let s = { ...n };
      if (s.async = this.defaults.async || s.async || false, n.extensions && (n.extensions.forEach((r) => {
        if (!r.name) throw new Error("extension name required");
        if ("renderer" in r) {
          let o = t.renderers[r.name];
          o ? t.renderers[r.name] = function(...i) {
            let u = r.renderer.apply(this, i);
            return u === false && (u = o.apply(this, i)), u;
          } : t.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let o = t[r.level];
          o ? o.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
      }), s.extensions = t), n.renderer) {
        let r = this.defaults.renderer || new S(this.defaults);
        for (let o in n.renderer) {
          if (!(o in r)) throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o)) continue;
          let i = o, u = n.renderer[i], a = r[i];
          r[i] = (...p) => {
            let c = u.apply(r, p);
            return c === false && (c = a.apply(r, p)), c || "";
          };
        }
        s.renderer = r;
      }
      if (n.tokenizer) {
        let r = this.defaults.tokenizer || new y(this.defaults);
        for (let o in n.tokenizer) {
          if (!(o in r)) throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o)) continue;
          let i = o, u = n.tokenizer[i], a = r[i];
          r[i] = (...p) => {
            let c = u.apply(r, p);
            return c === false && (c = a.apply(r, p)), c;
          };
        }
        s.tokenizer = r;
      }
      if (n.hooks) {
        let r = this.defaults.hooks || new _();
        for (let o in n.hooks) {
          if (!(o in r)) throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o)) continue;
          let i = o, u = n.hooks[i], a = r[i];
          _.passThroughHooks.has(o) ? r[i] = (p) => {
            if (this.defaults.async && _.passThroughHooksRespectAsync.has(o)) return (async () => {
              let d = await u.call(r, p);
              return a.call(r, d);
            })();
            let c = u.call(r, p);
            return a.call(r, c);
          } : r[i] = (...p) => {
            if (this.defaults.async) return (async () => {
              let d = await u.apply(r, p);
              return d === false && (d = await a.apply(r, p)), d;
            })();
            let c = u.apply(r, p);
            return c === false && (c = a.apply(r, p)), c;
          };
        }
        s.hooks = r;
      }
      if (n.walkTokens) {
        let r = this.defaults.walkTokens, o = n.walkTokens;
        s.walkTokens = function(i) {
          let u = [];
          return u.push(o.call(this, i)), r && (u = u.concat(r.call(this, i))), u;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return R.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return T.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      let r = { ...s }, o = { ...this.defaults, ...r }, i = this.onError(!!o.silent, !!o.async);
      if (this.defaults.async === true && r.async === false) return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return i(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (o.hooks && (o.hooks.options = o, o.hooks.block = e), o.async) return (async () => {
        let u = o.hooks ? await o.hooks.preprocess(n) : n, p = await (o.hooks ? await o.hooks.provideLexer(e) : e ? R.lex : R.lexInline)(u, o), c = o.hooks ? await o.hooks.processAllTokens(p) : p;
        o.walkTokens && await Promise.all(this.walkTokens(c, o.walkTokens));
        let m = await (o.hooks ? await o.hooks.provideParser(e) : e ? T.parse : T.parseInline)(c, o);
        return o.hooks ? await o.hooks.postprocess(m) : m;
      })().catch(i);
      try {
        o.hooks && (n = o.hooks.preprocess(n));
        let a = (o.hooks ? o.hooks.provideLexer(e) : e ? R.lex : R.lexInline)(n, o);
        o.hooks && (a = o.hooks.processAllTokens(a)), o.walkTokens && this.walkTokens(a, o.walkTokens);
        let c = (o.hooks ? o.hooks.provideParser(e) : e ? T.parse : T.parseInline)(a, o);
        return o.hooks && (c = o.hooks.postprocess(c)), c;
      } catch (u) {
        return i(u);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let s = "<p>An error occurred:</p><pre>" + O(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var E = new F();
function k(l3, e) {
  return E.parse(l3, e);
}
k.options = k.setOptions = function(l3) {
  return E.setOptions(l3), k.defaults = E.defaults, W(k.defaults), k;
};
k.getDefaults = I;
k.defaults = P;
function yt(...l3) {
  return E.use(...l3), k.defaults = E.defaults, W(k.defaults), k;
}
k.use = yt;
k.walkTokens = function(l3, e) {
  return E.walkTokens(l3, e);
};
k.parseInline = E.parseInline;
k.Parser = T;
k.parser = T.parse;
k.Renderer = S;
k.TextRenderer = z;
k.Lexer = R;
k.lexer = R.lex;
k.Tokenizer = y;
k.Hooks = _;
k.parse = k;
var gn = k.options;
var fn = k.setOptions;
var mn = k.walkTokens;
var xn = k.parseInline;
var Rn = T.parse;
var Tn = R.lex;

// ../../plugins/jira/src/template/markdown-to-html.ts
var SAFE_LINK = /^(https?:|mailto:)/i;
var escape = (text6) => text6.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function markdownToHtml(markdown, smartLinks) {
  const marked = new F({
    breaks: true,
    renderer: {
      html: ({ text: text6 }) => escape(text6),
      // Jira unfurls only a link marked as a smart link; its text is the address, which the smart link replaces.
      link(token) {
        if (smartLinks.has(token.href)) {
          return `<a href="${escape(token.href)}" data-card-appearance="inline">${escape(token.href)}</a>`;
        }
        return SAFE_LINK.test(token.href.trim()) ? false : escape(token.text);
      },
      // A remote image would make the reader's browser fetch from an address the comment's author chose.
      image: ({ text: text6 }) => escape(text6)
    }
  });
  return marked.parse(markdown, { async: false }).trim();
}

// ../../plugins/jira/src/template/verify.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isEmptyValue(value) {
  return value === void 0 || value === null || typeof value === "string" && value.trim() === "" || Array.isArray(value) && value.length === 0;
}
function countWords(text6) {
  const trimmed = text6.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
var SENTENCE_END = /[.!?]+['")\]]*(?:\s+|$)/;
function countSentences(text6) {
  const trimmed = text6.trim();
  if (trimmed === "") return 0;
  const sentences = trimmed.split(SENTENCE_END).filter((part) => part.trim() !== "");
  return Math.max(sentences.length, 1);
}
function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  return `a ${typeof value}`;
}
var EXPECTED = {
  prose: "a string",
  bullets: "an array of strings",
  labelled: "an object of strings"
};
function lengthReason(field, count2, label) {
  const { length } = field;
  if (length === null) return void 0;
  const { unit, min, max, severity } = length;
  const under = min !== void 0 && count2 < min;
  const over = max !== void 0 && count2 > max;
  if (!under && !over) return void 0;
  const subject = label === void 0 ? `\`${field.name}\`` : `\`${field.name}\` ${label}`;
  const bound = under ? `at least ${min}` : `at most ${max}`;
  return {
    code: "field-length",
    status: severity,
    detail: `${subject} has ${count2} ${unit}; ${bound} expected.`,
    field: field.name,
    ...label === void 0 ? {} : { label }
  };
}
function typeReason(field, detail, label) {
  return {
    code: "field-type",
    status: "fail",
    detail,
    field: field.name,
    ...label === void 0 ? {} : { label }
  };
}
function checkProse(field, value) {
  if (typeof value !== "string") {
    return [
      typeReason(field, `\`${field.name}\` is ${typeName(value)}; ${EXPECTED.prose} expected.`)
    ];
  }
  const count2 = field.length?.unit === "sentences" ? countSentences(value) : countWords(value);
  const reason = lengthReason(field, count2);
  return reason === void 0 ? [] : [reason];
}
function checkBullets(field, value) {
  if (!Array.isArray(value)) {
    return [
      typeReason(field, `\`${field.name}\` is ${typeName(value)}; ${EXPECTED.bullets} expected.`)
    ];
  }
  const bad = value.findIndex((item) => typeof item !== "string");
  if (bad !== -1) {
    return [
      typeReason(
        field,
        `\`${field.name}\` item ${bad + 1} is ${typeName(value[bad])}; ${EXPECTED.bullets} expected.`
      )
    ];
  }
  const reason = lengthReason(field, value.length);
  return reason === void 0 ? [] : [reason];
}
function checkLabelled(field, value) {
  if (!isObject(value)) {
    return [
      typeReason(field, `\`${field.name}\` is ${typeName(value)}; ${EXPECTED.labelled} expected.`)
    ];
  }
  const reasons = [];
  for (const label of field.labels ?? []) {
    const entry = Object.hasOwn(value, label) ? value[label] : void 0;
    if (entry === void 0 || entry === null || typeof entry === "string" && entry.trim() === "") {
      reasons.push(typeReason(field, `\`${field.name}\` has no value for \`${label}\`.`, label));
    }
  }
  for (const [label, entry] of Object.entries(value)) {
    if (entry === void 0 || entry === null) continue;
    if (typeof entry !== "string") {
      reasons.push(
        typeReason(
          field,
          `\`${field.name}\` \`${label}\` is ${typeName(entry)}; a string expected.`,
          label
        )
      );
      continue;
    }
    if (entry.trim() === "") continue;
    const count2 = field.length?.unit === "sentences" ? countSentences(entry) : countWords(entry);
    const reason = lengthReason(field, count2, label);
    if (reason !== void 0) reasons.push(reason);
  }
  return reasons;
}
function checkField(field, value) {
  if (isEmptyValue(value)) {
    return field.required ? [
      {
        code: "field-missing",
        status: "fail",
        detail: `\`${field.name}\` is required and is absent or empty.`,
        field: field.name
      }
    ] : [];
  }
  if (field.format === "prose") return checkProse(field, value);
  if (field.format === "bullets") return checkBullets(field, value);
  return checkLabelled(field, value);
}
function verifyFields(template, value) {
  if (!isObject(value)) {
    return [
      {
        code: "fields-invalid",
        status: "fail",
        detail: `The fields are ${typeName(value)}; an object keyed by field name is expected.`
      }
    ];
  }
  const declared = new Set(template.fields.map((field) => field.name));
  const unknown = Object.keys(value).filter((key) => !declared.has(key)).map((key) => ({
    code: "field-unknown",
    status: "fail",
    detail: `\`${key}\` is not a field of this template. Fields: ${[...declared].join(", ")}.`,
    field: key
  }));
  return [
    ...unknown,
    ...template.fields.flatMap(
      (field) => checkField(field, Object.hasOwn(value, field.name) ? value[field.name] : void 0)
    )
  ];
}

// ../../plugins/jira/src/template/render.ts
var PLACEHOLDER = /\{\{([A-Za-z][A-Za-z0-9.-]*)\}\}/g;
var HEADING = /^#{1,6}\s/;
var FIELD_PREFIX = "field.";
function text2(value) {
  return typeof value === "string" ? value.trim() : "";
}
function renderValue(field, value) {
  if (isEmptyValue(value)) return "";
  if (Array.isArray(value)) return value.map((item) => `- ${text2(item)}`).join("\n");
  if (isObject(value)) {
    const declared = field.labels ?? [];
    const rest = Object.keys(value).filter((key) => !declared.includes(key));
    return [...declared, ...rest].filter((label) => Object.hasOwn(value, label) && text2(value[label]) !== "").map((label) => `${label}: ${text2(value[label])}`).join("\n");
  }
  return text2(value);
}
function fieldValue(template, fields, name) {
  const field = template.fields.find((candidate) => candidate.name === name);
  if (field === void 0 || !isObject(fields) || !Object.hasOwn(fields, name)) return "";
  return renderValue(field, fields[name]);
}
function defaultRender(template, fields) {
  const sections = template.fields.flatMap((field) => {
    const value = fieldValue(template, fields, field.name);
    return value === "" ? [] : [`## ${field.heading}

${value}`];
  });
  return [...template.body === null ? [] : [template.body], ...sections].join("\n\n");
}
function layout(template, fields, facts) {
  const lines = [];
  for (const line of (template.body ?? "").split("\n")) {
    let placeholders = 0;
    let filled = 0;
    const rendered = line.replace(PLACEHOLDER, (_token, key) => {
      const value = key.startsWith(FIELD_PREFIX) ? fieldValue(template, fields, key.slice(FIELD_PREFIX.length)) : (facts[key] ?? "").trim();
      placeholders += 1;
      if (value !== "") filled += 1;
      return value;
    });
    if (placeholders > 0 && filled === 0) continue;
    lines.push({ text: rendered, heading: HEADING.test(line), blank: line.trim() === "" });
  }
  const kept = [];
  let start = 0;
  const closeSection = (end) => {
    const section = lines.slice(start, end);
    if (section[0]?.heading && section.slice(1).every((line) => line.text.trim() === "")) return;
    kept.push(...section);
  };
  lines.forEach((line, index) => {
    if (line.heading && index > start) {
      closeSection(index);
      start = index;
    }
  });
  closeSection(lines.length);
  const out = [];
  let previousBlank = true;
  for (const line of kept) {
    if (line.blank && previousBlank) continue;
    out.push(line.text);
    previousBlank = line.blank;
  }
  return out.join("\n");
}
function renderDocument(template, fields, facts = {}) {
  const body = template.kind === "work-item" ? defaultRender(template, fields) : layout(template, fields, facts);
  const trimmed = body.trimEnd();
  return trimmed === "" ? "" : `${trimmed}
`;
}

// ../../plugins/jira/src/template/resolve.ts
import { readdirSync as readdirSync2 } from "node:fs";
import { join as join7 } from "node:path";

// ../../plugins/jira/src/template/builtins.ts
import { readdirSync } from "node:fs";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { join as join6 } from "node:path";

// ../../plugins/jira/src/template/parse.ts
import { readFileSync as readFileSync3, statSync } from "node:fs";
import { basename } from "node:path";

// ../../node_modules/.pnpm/js-yaml@5.4.2/node_modules/js-yaml/dist/js-yaml.mjs
var NOT_RESOLVED = Symbol("NOT_RESOLVED");
function defineScalarTag(tagName, options) {
  return {
    tagName,
    nodeKind: "scalar",
    implicit: options.implicit ?? false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    implicitFirstChars: options.implicitFirstChars ?? null,
    resolve: options.resolve,
    identify: options.identify,
    represent: options.represent ?? ((data) => String(data)),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
function defineSequenceTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "sequence",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addItem: options.addItem,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
function defineMappingTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "mapping",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addPair: options.addPair,
    has: options.has,
    keys: options.keys,
    get: options.get,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
var strTag = defineScalarTag("tag:yaml.org,2002:str", {
  resolve: (source) => source,
  identify: (data) => typeof data === "string"
});
var NULL_VALUES$1 = [
  "",
  "~",
  "null",
  "Null",
  "NULL"
];
var nullCoreTag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: [
    "",
    "~",
    "n",
    "N"
  ],
  resolve: (source) => {
    if (NULL_VALUES$1.indexOf(source) !== -1) return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var nullJsonTag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: ["n"],
  resolve: (source, isExplicit) => {
    if (source === "null" || isExplicit && source === "") return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var NULL_VALUES = [
  "",
  "~",
  "null",
  "Null",
  "NULL"
];
var nullYaml11Tag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: [
    "",
    "~",
    "n",
    "N"
  ],
  resolve: (source) => {
    if (NULL_VALUES.indexOf(source) !== -1) return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var TRUE_VALUES$2 = [
  "true",
  "True",
  "TRUE"
];
var FALSE_VALUES$2 = [
  "false",
  "False",
  "FALSE"
];
var boolCoreTag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: [
    "t",
    "T",
    "f",
    "F"
  ],
  resolve: (source) => {
    if (TRUE_VALUES$2.indexOf(source) !== -1) return true;
    if (FALSE_VALUES$2.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var TRUE_VALUES$1 = ["true"];
var FALSE_VALUES$1 = ["false"];
var boolJsonTag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: ["t", "f"],
  resolve: (source) => {
    if (TRUE_VALUES$1.indexOf(source) !== -1) return true;
    if (FALSE_VALUES$1.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var TRUE_VALUES = [
  "true",
  "True",
  "TRUE",
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON"
];
var FALSE_VALUES = [
  "false",
  "False",
  "FALSE",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var boolYaml11Tag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: [
    "y",
    "Y",
    "n",
    "N",
    "t",
    "T",
    "f",
    "F",
    "o",
    "O"
  ],
  resolve: (source) => {
    if (TRUE_VALUES.indexOf(source) !== -1) return true;
    if (FALSE_VALUES.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var YAML_INTEGER_IMPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:0o[0-7]+|0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
var YAML_INTEGER_EXPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$2(source) {
  let value = source;
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger$2(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger$2(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intCoreTag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ..."0123456789"
  ],
  resolve: resolveYamlInteger$2,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_INTEGER_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)$");
var YAML_INTEGER_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$1(source) {
  let value = source;
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger$1(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger$1(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intJsonTag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: ["-", ..."0123456789"],
  resolve: resolveYamlInteger$1,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_INTEGER_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1_]+|[-+]?0[0-7_]+|[-+]?0x[0-9a-fA-F_]+|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+|[-+]?(?:0|[1-9][0-9_]*))$");
function parseYamlInteger(source) {
  let value = source.replace(/_/g, "");
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  if (value.includes(":")) {
    let result = 0;
    for (const part of value.split(":")) result = result * 60 + Number(part);
    return sign * result;
  }
  if (value !== "0" && value[0] === "0") return sign * parseInt(value, 8);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger(source) {
  if (!YAML_INTEGER_PATTERN.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intYaml11Tag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ..."0123456789"
  ],
  resolve: resolveYamlInteger,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_FLOAT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$2(source) {
  if (!YAML_FLOAT_PATTERN$1.test(source)) return NOT_RESOLVED;
  let value = source.toLowerCase();
  const sign = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  const result = sign * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN$1.test(source)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$2(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatCoreTag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ".",
    ..."0123456789"
  ],
  resolve: resolveYamlFloat$2,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat$2
});
var YAML_FLOAT_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$");
var YAML_FLOAT_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$1(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_FLOAT_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
    let value = source.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".includes(value[0])) value = value.slice(1);
    if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    if (value === ".nan") return NaN;
    const result2 = sign * parseFloat(value);
    return Number.isFinite(result2) ? result2 : NOT_RESOLVED;
  }
  if (!YAML_FLOAT_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  const result = Number(source);
  if (Number.isFinite(result)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$1(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatJsonTag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: ["-", ..."0123456789"],
  resolve: resolveYamlFloat$1,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat$1
});
var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:(?:[0-9][0-9_]*)?\\.[0-9_]*)(?:[eE][-+][0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(source) {
  if (!YAML_FLOAT_PATTERN.test(source)) return NOT_RESOLVED;
  let value = source.toLowerCase().replace(/_/g, "");
  const sign = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  let result = 0;
  if (value.includes(":")) {
    for (const part of value.split(":")) result = result * 60 + Number(part);
    result *= sign;
  } else result = sign * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN.test(source)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatYaml11Tag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ".",
    ..."0123456789"
  ],
  resolve: resolveYamlFloat,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat
});
var mergeTag = defineScalarTag("tag:yaml.org,2002:merge", {
  implicit: true,
  implicitFirstChars: ["<"],
  resolve: (source, isExplicit) => {
    if (source === "<<" || isExplicit && source === "") return "<<";
    return NOT_RESOLVED;
  },
  identify: () => false
});
var BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
function resolveYamlBinary(source) {
  const input = source.replace(/\s/g, "");
  if (input.length % 4 !== 0 || !BASE64_PATTERN.test(input)) return NOT_RESOLVED;
  const binary = atob(input);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) result[index] = binary.charCodeAt(index);
  return result;
}
function representYamlBinary(object) {
  let binary = "";
  for (let index = 0; index < object.length; index++) binary += String.fromCharCode(object[index]);
  return btoa(binary);
}
var binaryTag = defineScalarTag("tag:yaml.org,2002:binary", {
  resolve: resolveYamlBinary,
  identify: (object) => Object.prototype.toString.call(object) === "[object Uint8Array]",
  represent: representYamlBinary
});
var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
function makeUtcDate(year, month, day, hour = 0, minute = 0, second = 0, fraction = 0) {
  const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  date.setUTCFullYear(year, month, day);
  return date;
}
function resolveYamlTimestamp(source) {
  let match = YAML_DATE_REGEXP.exec(source);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(source);
  if (match === null) return NOT_RESOLVED;
  const year = +match[1];
  const month = +match[2] - 1;
  const day = +match[3];
  if (!match[4]) {
    const date2 = makeUtcDate(year, month, day);
    if (date2.getUTCFullYear() !== year || date2.getUTCMonth() !== month || date2.getUTCDate() !== day) return NOT_RESOLVED;
    return date2;
  }
  const hour = +match[4];
  const minute = +match[5];
  const second = +match[6];
  let fraction = 0;
  if (hour > 23 || minute > 59 || second > 59) return NOT_RESOLVED;
  if (match[7]) {
    let value = match[7].slice(0, 3);
    while (value.length < 3) value += "0";
    fraction = +value;
  }
  const date = makeUtcDate(year, month, day, hour, minute, second, fraction);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return NOT_RESOLVED;
  if (match[9]) {
    const offsetHour = +match[10];
    const offsetMinute = +(match[11] || 0);
    if (offsetHour > 23 || offsetMinute > 59) return NOT_RESOLVED;
    const offset = (offsetHour * 60 + offsetMinute) * 6e4;
    date.setTime(date.getTime() - (match[9] === "-" ? -offset : offset));
  }
  return date;
}
var timestampTag = defineScalarTag("tag:yaml.org,2002:timestamp", {
  implicit: true,
  implicitFirstChars: [..."0123456789"],
  resolve: resolveYamlTimestamp,
  identify: (object) => object instanceof Date,
  represent: (object) => object.toISOString()
});
var seqTag = defineSequenceTag("tag:yaml.org,2002:seq", {
  create: () => [],
  addItem: (container, item) => {
    container.push(item);
  },
  identify: Array.isArray
});
function isPlainObject(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const prototype = Object.getPrototypeOf(data);
  return prototype === null || prototype === Object.prototype;
}
function pick(object, keys) {
  const result = {};
  for (const key of keys) if (object[key] !== void 0) result[key] = object[key];
  return result;
}
var omapTag = defineSequenceTag("tag:yaml.org,2002:omap", {
  create: () => ({
    list: [],
    seen: /* @__PURE__ */ new Set()
  }),
  addItem: (carrier, item) => {
    let key;
    if (item instanceof Map) {
      if (item.size !== 1) return "cannot resolve an ordered map item";
      key = item.keys().next().value;
    } else if (isPlainObject(item)) {
      const itemKeys = Object.keys(item);
      if (itemKeys.length !== 1) return "cannot resolve an ordered map item";
      key = itemKeys[0];
    } else return "cannot resolve an ordered map item";
    if (carrier.seen.has(key)) return "duplicate key in ordered map";
    carrier.seen.add(key);
    carrier.list.push(item);
    return "";
  },
  finalize: (carrier) => carrier.list,
  identify: () => false
});
var pairsTag = defineSequenceTag("tag:yaml.org,2002:pairs", {
  create: () => [],
  addItem: (container, item) => {
    if (item instanceof Map) {
      if (item.size !== 1) return "cannot resolve a pairs item";
      container.push(item.entries().next().value);
      return "";
    }
    if (Object.prototype.toString.call(item) !== "[object Object]") return "cannot resolve a pairs item";
    const object = item;
    const keys = Object.keys(object);
    if (keys.length !== 1) return "cannot resolve a pairs item";
    container.push([keys[0], object[keys[0]]]);
    return "";
  },
  identify: () => false
});
var mapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => ({}),
  identify: isPlainObject,
  represent: (o) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of Object.keys(o)) map.set(key, o[key]);
    return map;
  },
  addPair: (container, key, value) => {
    if (key !== null && typeof key === "object") return "object-based map does not support complex keys";
    const normalizedKey = String(key);
    if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    else container[normalizedKey] = value;
    return "";
  },
  has: (container, key) => {
    if (key !== null && typeof key === "object") return false;
    return Object.prototype.hasOwnProperty.call(container, String(key));
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => {
    const normalizedKey = String(key);
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
    return container[normalizedKey];
  }
});
var setTag = defineMappingTag("tag:yaml.org,2002:set", {
  create: () => /* @__PURE__ */ new Set(),
  identify: (data) => data instanceof Set,
  represent: (data) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of data) map.set(key, null);
    return map;
  },
  addPair: (container, key, value) => {
    if (value !== null) return "cannot resolve a set item";
    container.add(key);
    return "";
  },
  has: (container, key) => container.has(key),
  keys: (container) => container.keys(),
  get: () => null
});
function createTagDefinitionMap() {
  return {
    scalar: /* @__PURE__ */ Object.create(null),
    sequence: /* @__PURE__ */ Object.create(null),
    mapping: /* @__PURE__ */ Object.create(null)
  };
}
function createTagDefinitionListMap() {
  return {
    scalar: [],
    sequence: [],
    mapping: []
  };
}
function compileTags(tags) {
  const result = [];
  for (const tag of tags) {
    let index = result.length;
    for (let previousIndex = 0; previousIndex < result.length; previousIndex++) {
      const previous = result[previousIndex];
      if (previous.nodeKind === tag.nodeKind && previous.tagName === tag.tagName && previous.matchByTagPrefix === tag.matchByTagPrefix) {
        index = previousIndex;
        break;
      }
    }
    result[index] = tag;
  }
  return result;
}
var Schema = class Schema2 {
  tags;
  /** @internal */
  implicitScalarTags;
  /**
  * Dispatch implicit scalar resolvers by `source.charAt(0)`. Each bucket holds
  * the resolvers that may match that key, in schema order; a key absent from
  * the map uses
  * {@link Schema.implicitScalarAnyFirstChar}
  * (resolvers that declared no first-char constraint, so they apply to any
  * first character).
  */
  implicitScalarByFirstChar;
  implicitScalarAnyFirstChar;
  /**
  * The default scalar tag (`!!str`), resolved once so the composer's fallback
  * for unresolved plain scalars avoids a keyed lookup per scalar.
  *
  * @internal
  */
  defaultScalarTag;
  /**
  * The default container tags (`!!seq` / `!!map`), used by the dumper: when a
  * value is identified by its default tag, the tag is implicit and not
  * printed. Undefined if the schema does not define them (then such values
  * can't be dumped).
  *
  * @internal
  */
  defaultSequenceTag;
  /** @internal */
  defaultMappingTag;
  exact;
  prefix;
  constructor(tags) {
    const compiledTags = compileTags(tags);
    const implicitScalarTags = [];
    const exact = createTagDefinitionMap();
    const prefix = createTagDefinitionListMap();
    for (const tag of compiledTags) {
      if (tag.nodeKind === "scalar" && tag.implicit) {
        if (tag.matchByTagPrefix) throw new Error("Implicit scalar tags cannot match by tag prefix");
        implicitScalarTags.push(tag);
      }
      switch (tag.nodeKind) {
        case "scalar":
          if (tag.matchByTagPrefix) prefix.scalar.push(tag);
          else exact.scalar[tag.tagName] = tag;
          break;
        case "sequence":
          if (tag.matchByTagPrefix) prefix.sequence.push(tag);
          else exact.sequence[tag.tagName] = tag;
          break;
        case "mapping":
          if (tag.matchByTagPrefix) prefix.mapping.push(tag);
          else exact.mapping[tag.tagName] = tag;
          break;
      }
    }
    const implicitScalarAnyFirstChar = implicitScalarTags.filter((tag) => tag.implicitFirstChars === null);
    const keys = /* @__PURE__ */ new Set();
    for (const tag of implicitScalarTags) if (tag.implicitFirstChars !== null) for (const key of tag.implicitFirstChars) keys.add(key);
    const implicitScalarByFirstChar = /* @__PURE__ */ new Map();
    for (const key of keys) implicitScalarByFirstChar.set(key, implicitScalarTags.filter((tag) => tag.implicitFirstChars === null || tag.implicitFirstChars.indexOf(key) !== -1));
    const defaultScalarTag = exact.scalar["tag:yaml.org,2002:str"];
    if (!defaultScalarTag) throw new Error("schema does not define the default scalar tag (tag:yaml.org,2002:str)");
    this.tags = compiledTags;
    this.implicitScalarTags = implicitScalarTags;
    this.implicitScalarByFirstChar = implicitScalarByFirstChar;
    this.implicitScalarAnyFirstChar = implicitScalarAnyFirstChar;
    this.defaultScalarTag = defaultScalarTag;
    this.defaultSequenceTag = exact.sequence["tag:yaml.org,2002:seq"];
    this.defaultMappingTag = exact.mapping["tag:yaml.org,2002:map"];
    this.exact = exact;
    this.prefix = prefix;
  }
  /** @internal */
  lookupScalarTag(tagName) {
    const exactTag = this.exact.scalar[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.scalar) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  lookupSequenceTag(tagName) {
    const exactTag = this.exact.sequence[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.sequence) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  lookupMappingTag(tagName) {
    const exactTag = this.exact.mapping[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.mapping) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  resolveImplicitScalarTag(source) {
    const candidates = this.implicitScalarByFirstChar.get(source.charAt(0)) ?? this.implicitScalarAnyFirstChar;
    for (const tag2 of candidates) {
      const value = tag2.resolve(source, false, tag2.tagName);
      if (value !== NOT_RESOLVED) return {
        value,
        tag: tag2
      };
    }
    const tag = this.defaultScalarTag;
    return {
      value: tag.resolve(source, false, tag.tagName),
      tag
    };
  }
  /**
  * Creates a new schema with the specified tags added. If a tag already
  * exists, it is replaced by the specified tag.
  *
  * @example
  *
  * ```javascript
  * import { CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'
  *
  * const schema = CORE_SCHEMA.withTags(mergeTag, realMapTag)
  * ```
  */
  withTags(...tags) {
    let flatTags = [];
    for (const tag of tags) flatTags = flatTags.concat(tag);
    return new Schema2([...this.tags, ...flatTags]);
  }
};
var FAILSAFE_SCHEMA = new Schema([
  strTag,
  seqTag,
  mapTag
]);
var JSON_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullJsonTag,
  boolJsonTag,
  intJsonTag,
  floatJsonTag
]);
var CORE_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullCoreTag,
  boolCoreTag,
  intCoreTag,
  floatCoreTag
]);
var YAML11_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullYaml11Tag,
  boolYaml11Tag,
  intYaml11Tag,
  floatYaml11Tag,
  timestampTag,
  mergeTag,
  binaryTag,
  omapTag,
  pairsTag,
  setTag
]);
var DUMP_SCHEMA = YAML11_SCHEMA.withTags({
  ...intYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    const result = intYaml11Tag.resolve(source, isExplicit, tagName);
    return result === NOT_RESOLVED ? intCoreTag.resolve(source, isExplicit, tagName) : result;
  }
}, {
  ...floatYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    const result = floatYaml11Tag.resolve(source, isExplicit, tagName);
    return result === NOT_RESOLVED ? floatCoreTag.resolve(source, isExplicit, tagName) : result;
  }
});
var realMapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => /* @__PURE__ */ new Map(),
  addPair: (container, key, value) => {
    container.set(key, value);
    return "";
  },
  has: (container, key) => container.has(key),
  keys: (container) => container.keys(),
  get: (container, key) => container.get(key),
  identify: (data) => data instanceof Map || isPlainObject(data),
  represent: (data) => {
    if (data instanceof Map) return data;
    const map = /* @__PURE__ */ new Map();
    const obj = data;
    for (const key of Object.keys(obj)) map.set(key, obj[key]);
    return map;
  }
});
function normalizeKey(key) {
  if (Array.isArray(key)) {
    const array = Array.prototype.slice.call(key);
    for (let index = 0; index < array.length; index++) {
      if (Array.isArray(array[index])) return null;
      if (typeof array[index] === "object" && Object.prototype.toString.call(array[index]) === "[object Object]") array[index] = "[object Object]";
    }
    return String(array);
  }
  if (typeof key === "object" && Object.prototype.toString.call(key) === "[object Object]") return "[object Object]";
  return String(key);
}
var legacyMapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => ({}),
  identify: isPlainObject,
  represent: (o) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of Object.keys(o)) map.set(key, o[key]);
    return map;
  },
  addPair: (container, key, value) => {
    const normalizedKey = normalizeKey(key);
    if (normalizedKey === null) return "nested arrays are not supported inside keys";
    if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    else container[normalizedKey] = value;
    return "";
  },
  has: (container, key) => {
    const normalizedKey = normalizeKey(key);
    return normalizedKey !== null && Object.prototype.hasOwnProperty.call(container, normalizedKey);
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => {
    const normalizedKey = String(key);
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
    return container[normalizedKey];
  }
});
var DEFAULT_SNIPPET_OPTIONS = {
  maxLength: 79,
  indent: 1,
  linesBefore: 3,
  linesAfter: 2
};
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  let head = "";
  let tail = "";
  const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
  };
}
function padStart(string, max) {
  return " ".repeat(Math.max(max - string.length, 0)) + string;
}
function makeSnippet(mark, options) {
  if (!mark.buffer) return null;
  const opts = {
    ...DEFAULT_SNIPPET_OPTIONS,
    ...options
  };
  const re2 = /\r?\n|\r|\0/g;
  const lineStarts = [0];
  const lineEnds = [];
  let match;
  let foundLineNo = -1;
  while (match = re2.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  let result = "";
  const lineNoLength = Math.min(mark.line + opts.linesAfter, lineEnds.length).toString().length;
  const maxLineLength = opts.maxLength - (opts.indent + lineNoLength + 3);
  for (let i = 1; i <= opts.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = `${" ".repeat(opts.indent)}${padStart((mark.line - i + 1).toString(), lineNoLength)} | ${line2.str}
${result}`;
  }
  const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += `${" ".repeat(opts.indent)}${padStart((mark.line + 1).toString(), lineNoLength)} | ${line.str}
`;
  result += `${"-".repeat(opts.indent + lineNoLength + 3 + line.pos)}^
`;
  for (let i = 1; i <= opts.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += `${" ".repeat(opts.indent)}${padStart((mark.line + i + 1).toString(), lineNoLength)} | ${line2.str}
`;
  }
  return result.replace(/\n$/, "");
}
function formatError(exception, compact) {
  let where = "";
  if (!exception.mark) return exception.reason;
  if (exception.mark.name) where += `in "${exception.mark.name}" `;
  where += `(${exception.mark.line + 1}:${exception.mark.column + 1})`;
  if (!compact && exception.mark.snippet) where += `

${exception.mark.snippet}`;
  return `${exception.reason} ${where}`;
}
var YAMLException = class YAMLException2 extends Error {
  reason;
  mark;
  /**
  * Optional `mark` contains source snippet data. Usually, use
  * {@link YAMLException.throwAt} instead of passing it directly.
  */
  constructor(reason, mark) {
    super();
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
  /**
  * Returns the formatted error, omitting the source snippet in compact mode.
  */
  toString(compact) {
    return `${this.name}: ${formatError(this, compact)}`;
  }
  /**
  * Builds a YAMLException with a source snippet and throws it. `source` is
  * the raw input text; `position` is an offset into it.
  */
  static throwAt(source, position, message, filename = "") {
    let line = 0;
    let lineStart = 0;
    for (let index = 0; index < position; index++) {
      const ch = source.charCodeAt(index);
      if (ch === 10) {
        line++;
        lineStart = index + 1;
      } else if (ch === 13) {
        line++;
        if (source.charCodeAt(index + 1) === 10) index++;
        lineStart = index + 1;
      }
    }
    const mark = {
      name: filename,
      buffer: source,
      position,
      line,
      column: position - lineStart
    };
    mark.snippet = makeSnippet(mark);
    throw new YAMLException2(message, mark);
  }
};
var EVENT_ID = {
  DOCUMENT: 1,
  SEQUENCE: 2,
  MAPPING: 3,
  SCALAR: 4,
  ALIAS: 5,
  POP: 6
};
var SCALAR_STYLE = {
  PLAIN: 1,
  SINGLE_QUOTED: 2,
  DOUBLE_QUOTED: 3,
  LITERAL_BLOCK: 4,
  FOLDED_BLOCK: 5
};
var COLLECTION_STYLE = {
  BLOCK: 1,
  FLOW: 2
};
var CHOMPING_MODE = {
  CLIP: 1,
  STRIP: 2,
  KEEP: 3
};
var NO_RANGE$3 = -1;
function simpleEscapeSequence(c) {
  switch (c) {
    case 48:
      return "\0";
    case 97:
      return "\x07";
    case 98:
      return "\b";
    case 116:
      return "	";
    case 9:
      return "	";
    case 110:
      return "\n";
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 114:
      return "\r";
    case 101:
      return "\x1B";
    case 32:
      return " ";
    case 34:
      return '"';
    case 47:
      return "/";
    case 92:
      return "\\";
    case 78:
      return "\x85";
    case 95:
      return "\xA0";
    case 76:
      return "\u2028";
    case 80:
      return "\u2029";
    default:
      return "";
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (let i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function charFromCodepoint(c) {
  if (c <= 65535) return String.fromCharCode(c);
  return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function fromHexCode$1(c) {
  if (c >= 48 && c <= 57) return c - 48;
  return (c | 32) - 97 + 10;
}
function escapedHexLen$1(c) {
  if (c === 120) return 2;
  if (c === 117) return 4;
  return 8;
}
function skipFoldedBreaks(input, position, end) {
  let breaks = 0;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10) {
      breaks++;
      position++;
    } else if (ch === 13) {
      breaks++;
      position++;
      if (input.charCodeAt(position) === 10) position++;
    } else if (ch === 32 || ch === 9) position++;
    else break;
  }
  return {
    position,
    breaks
  };
}
function foldedBreaks(count2) {
  if (count2 === 1) return " ";
  return "\n".repeat(count2 - 1);
}
function getPlainValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, captureEnd);
}
function getSingleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 39) {
      result += input.slice(captureStart, position) + "'";
      position += 2;
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getDoubleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 92) {
      result += input.slice(captureStart, position);
      position++;
      const escaped = input.charCodeAt(position);
      if (escaped === 10 || escaped === 13) position = skipFoldedBreaks(input, position, end).position;
      else if (escaped < 256 && simpleEscapeCheck[escaped]) {
        result += simpleEscapeMap[escaped];
        position++;
      } else {
        let hexLength = escapedHexLen$1(escaped);
        let hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          position++;
          const digit = fromHexCode$1(input.charCodeAt(position));
          hexResult = (hexResult << 4) + digit;
        }
        result += charFromCodepoint(hexResult);
        position++;
      }
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getBlockValue(input, start, end, indent, chomping, folded) {
  const textIndent = indent < 0 ? 0 : indent;
  const region = input.slice(start, end).replace(/\r\n?/g, "\n");
  const lines = region === "" ? [] : (region.endsWith("\n") ? region.slice(0, -1) : region).split("\n");
  let result = "";
  let didReadContent = false;
  let emptyLines = 0;
  let atMoreIndented = false;
  for (const line of lines) {
    let column = 0;
    while (column < textIndent && line.charCodeAt(column) === 32) column++;
    if (indent < 0 || column >= line.length) {
      emptyLines++;
      continue;
    }
    const content = line.slice(textIndent);
    const first = content.charCodeAt(0);
    if (folded) if (first === 32 || first === 9) {
      atMoreIndented = true;
      result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
    } else if (atMoreIndented) {
      atMoreIndented = false;
      result += "\n".repeat(emptyLines + 1);
    } else if (emptyLines === 0) {
      if (didReadContent) result += " ";
    } else result += "\n".repeat(emptyLines);
    else result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
    result += content;
    didReadContent = true;
    emptyLines = 0;
  }
  if (chomping === CHOMPING_MODE.KEEP) result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
  else if (chomping !== CHOMPING_MODE.STRIP) {
    if (didReadContent) result += "\n";
  }
  return result;
}
function getScalarValue(input, scalar) {
  if (scalar.valueStart === NO_RANGE$3) return "";
  const { valueStart, valueEnd } = scalar;
  if (scalar.fast) return input.slice(valueStart, valueEnd);
  switch (scalar.style) {
    case SCALAR_STYLE.SINGLE_QUOTED:
      return getSingleQuotedValue(input, valueStart, valueEnd);
    case SCALAR_STYLE.DOUBLE_QUOTED:
      return getDoubleQuotedValue(input, valueStart, valueEnd);
    case SCALAR_STYLE.LITERAL_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, false);
    case SCALAR_STYLE.FOLDED_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, true);
    default:
      return getPlainValue(input, valueStart, valueEnd);
  }
}
var DEFAULT_TAG_HANDLERS = Object.assign(/* @__PURE__ */ Object.create(null), {
  "!": "!",
  "!!": "tag:yaml.org,2002:"
});
function tagNameFull(rawTag, tagHandlers) {
  if (rawTag.startsWith("!<") && rawTag.endsWith(">")) return decodeURIComponent(rawTag.slice(2, -1));
  const handleEnd = rawTag.indexOf("!", 1);
  const handle = handleEnd === -1 ? "!" : rawTag.slice(0, handleEnd + 1);
  const prefix = tagHandlers?.[handle] ?? DEFAULT_TAG_HANDLERS[handle] ?? handle;
  return decodeURIComponent(prefix) + decodeURIComponent(rawTag.slice(handle.length));
}
var NO_RANGE$2 = -1;
var MERGE_TAG_NAME = "tag:yaml.org,2002:merge";
var DEFAULT_CONSTRUCTOR_OPTIONS = {
  filename: "",
  schema: CORE_SCHEMA,
  json: false,
  maxTotalMergeKeys: 1e4,
  maxAliases: -1
};
function eventPosition$1(event) {
  if ("tagStart" in event && event.tagStart !== NO_RANGE$2) return event.tagStart;
  if ("anchorStart" in event && event.anchorStart !== NO_RANGE$2) return event.anchorStart;
  if ("valueStart" in event && event.valueStart !== NO_RANGE$2) return event.valueStart;
  if ("start" in event) return event.start;
  return 0;
}
function throwError$1(state, message) {
  YAMLException.throwAt(state.source, state.position, message, state.filename);
}
function finalizeCollection(state, position, tag, carrier) {
  try {
    return tag.finalize(carrier);
  } catch (error) {
    if (error instanceof YAMLException) throw error;
    YAMLException.throwAt(state.source, position, error instanceof Error ? error.message : String(error), state.filename);
  }
}
function constructScalar(state, event) {
  const source = getScalarValue(state.source, event);
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  const strTag2 = state.schema.defaultScalarTag;
  if (rawTag !== "") {
    if (rawTag === "!") return {
      value: source,
      tag: strTag2
    };
    const tagName = tagNameFull(rawTag, state.tagHandlers);
    const scalarTag = state.schema.lookupScalarTag(tagName);
    if (scalarTag) {
      const result = scalarTag.resolve(source, true, tagName);
      if (result === NOT_RESOLVED) throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      return {
        value: result,
        tag: scalarTag
      };
    }
    const collectionTagDef = state.schema.lookupMappingTag(tagName) ?? state.schema.lookupSequenceTag(tagName);
    if (collectionTagDef) {
      if (source !== "") throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      const carrier = collectionTagDef.create(tagName);
      return {
        value: collectionTagDef.carrierIsResult ? carrier : finalizeCollection(state, state.position, collectionTagDef, carrier),
        tag: collectionTagDef
      };
    }
    throwError$1(state, `unknown scalar tag !<${tagName}>`);
  }
  if (event.style === SCALAR_STYLE.PLAIN) return state.schema.resolveImplicitScalarTag(source);
  return {
    value: strTag2.resolve(source, false, strTag2.tagName),
    tag: strTag2
  };
}
function collectionTagName(state, event, defaultTagName) {
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  return rawTag === "" || rawTag === "!" ? defaultTagName : tagNameFull(rawTag, state.tagHandlers);
}
function isMappingTag(tag) {
  return tag.nodeKind === "mapping";
}
function chargeMergeWork(state) {
  state.totalMergeKeys++;
  if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) throwError$1(state, `merge keys exceeded maxTotalMergeKeys (${state.maxTotalMergeKeys})`);
}
function mergeKeys(state, frame, source, sourceTag) {
  chargeMergeWork(state);
  for (const sourceKey of sourceTag.keys(source)) {
    chargeMergeWork(state);
    if (frame.tag.has(frame.value, sourceKey)) continue;
    const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source, sourceKey));
    if (err) throwError$1(state, err);
    frame.overridable ??= /* @__PURE__ */ new Set();
    frame.overridable.add(sourceKey);
  }
}
function mergeSource(state, frame, source, sourceTag) {
  state.position = frame.keyPosition;
  if (isMappingTag(sourceTag)) mergeKeys(state, frame, source, sourceTag);
  else if (sourceTag.nodeKind === "sequence" && Array.isArray(source)) {
    if (source.length > 100) throwError$1(state, "abnormal merge sequence size");
    for (const element of source) {
      const elementTag = state.nodeTags.get(element);
      if (!elementTag) throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
      mergeKeys(state, frame, element, elementTag);
    }
  } else throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
}
function addMappingValue(state, frame, key, value, tag) {
  state.position = frame.keyPosition;
  if (frame.keyIsMerge) {
    mergeSource(state, frame, value, tag);
    return;
  }
  if (!state.json && frame.tag.has(frame.value, key) && !frame.overridable?.has(key)) throwError$1(state, "duplicated mapping key");
  const err = frame.tag.addPair(frame.value, key, value);
  if (err) throwError$1(state, err);
  frame.overridable?.delete(key);
}
function addValue(state, value, tag) {
  const frame = state.frames[state.frames.length - 1];
  if (frame.kind === "document") {
    frame.value = value;
    frame.hasValue = true;
  } else if (frame.kind === "sequence") {
    if (isMappingTag(tag)) state.nodeTags.set(value, tag);
    const err = frame.tag.addItem(frame.value, value, frame.index++);
    if (err) throwError$1(state, err);
  } else if (frame.hasKey) {
    const key = frame.key;
    frame.key = void 0;
    frame.hasKey = false;
    addMappingValue(state, frame, key, value, tag);
  } else {
    frame.key = value;
    frame.keyPosition = state.position;
    frame.hasKey = true;
    frame.keyIsMerge = tag.tagName === MERGE_TAG_NAME;
  }
}
function storeAnchor(state, event, value, tag, isValueFinal) {
  if (event.anchorStart !== NO_RANGE$2) {
    const anchor = {
      value,
      tag,
      isValueFinal
    };
    state.anchors.set(state.source.slice(event.anchorStart, event.anchorEnd), anchor);
    return anchor;
  }
  return null;
}
function constructFromEvents(events, options) {
  const state = {
    ...DEFAULT_CONSTRUCTOR_OPTIONS,
    ...options,
    events,
    documents: [],
    eventIndex: 0,
    position: 0,
    frames: [],
    anchors: /* @__PURE__ */ new Map(),
    nodeTags: /* @__PURE__ */ new Map(),
    tagHandlers: /* @__PURE__ */ Object.create(null),
    totalMergeKeys: 0,
    aliasCount: 0
  };
  while (state.eventIndex < state.events.length) {
    const event = state.events[state.eventIndex++];
    state.position = eventPosition$1(event);
    switch (event.type) {
      case EVENT_ID.DOCUMENT:
        state.anchors = /* @__PURE__ */ new Map();
        state.nodeTags = /* @__PURE__ */ new Map();
        state.aliasCount = 0;
        state.tagHandlers = /* @__PURE__ */ Object.create(null);
        for (const directive of event.directives) if (directive.kind === "tag") state.tagHandlers[directive.handle] = directive.prefix;
        state.frames.push({
          kind: "document",
          position: state.position,
          value: void 0,
          hasValue: false
        });
        break;
      case EVENT_ID.SCALAR: {
        const { value, tag } = constructScalar(state, event);
        storeAnchor(state, event, value, tag, true);
        addValue(state, value, tag);
        break;
      }
      case EVENT_ID.SEQUENCE: {
        const tagName = collectionTagName(state, event, "tag:yaml.org,2002:seq");
        const tag = state.schema.lookupSequenceTag(tagName);
        if (!tag) throwError$1(state, `unknown sequence tag !<${tagName}>`);
        const value = tag.create(tagName);
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
        state.frames.push({
          kind: "sequence",
          position: state.position,
          value,
          tag,
          anchor,
          index: 0
        });
        break;
      }
      case EVENT_ID.MAPPING: {
        const tagName = collectionTagName(state, event, "tag:yaml.org,2002:map");
        const tag = state.schema.lookupMappingTag(tagName);
        if (!tag) throwError$1(state, `unknown mapping tag !<${tagName}>`);
        const value = tag.create(tagName);
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
        state.frames.push({
          kind: "mapping",
          position: state.position,
          value,
          tag,
          anchor,
          key: void 0,
          keyPosition: state.position,
          hasKey: false,
          keyIsMerge: false,
          overridable: null
        });
        break;
      }
      case EVENT_ID.ALIAS: {
        if (state.maxAliases !== -1 && ++state.aliasCount > state.maxAliases) throwError$1(state, `aliases exceeded maxAliases (${state.maxAliases})`);
        const name = state.source.slice(event.anchorStart, event.anchorEnd);
        const anchor = state.anchors.get(name);
        if (!anchor) throwError$1(state, `unidentified alias "${name}"`);
        if (!anchor.isValueFinal) throwError$1(state, `recursive alias "${name}" is not supported for tag ${anchor.tag.tagName} because it uses finalize()`);
        addValue(state, anchor.value, anchor.tag);
        break;
      }
      case EVENT_ID.POP: {
        const frame = state.frames.pop();
        if (frame.kind === "mapping" && frame.hasKey) {
          state.position = frame.keyPosition;
          throwError$1(state, "incomplete mapping pair in event stream");
        }
        if (frame.kind === "document") state.documents.push(frame.value);
        else {
          const value = frame.tag.carrierIsResult ? frame.value : finalizeCollection(state, frame.position, frame.tag, frame.value);
          if (frame.anchor) {
            frame.anchor.value = value;
            frame.anchor.isValueFinal = true;
          }
          addValue(state, value, frame.tag);
        }
        break;
      }
    }
  }
  return state.documents;
}
var NO_RANGE$1 = -1;
var HAS_OWN = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
var NS_URI_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$,_.!~*'()\[\]])`;
var NS_TAG_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$.~*'()_])`;
var PATTERN_TAG_URI = new RegExp(`^(?:${NS_URI_CHAR})*$`);
var PATTERN_TAG_SUFFIX = new RegExp(`^(?:${NS_TAG_CHAR})+$`);
var PATTERN_TAG_PREFIX = new RegExp(`^(?:!(?:${NS_URI_CHAR})*|${NS_TAG_CHAR}(?:${NS_URI_CHAR})*)$`);
var DEFAULT_PARSER_OPTIONS = {
  filename: "",
  maxDepth: 100
};
function addDocumentEvent(state, explicitStart, explicitEnd) {
  state.events.push({
    type: EVENT_ID.DOCUMENT,
    explicitStart,
    explicitEnd,
    directives: state.directives
  });
}
function addSequenceEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: EVENT_ID.SEQUENCE,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function addMappingEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: EVENT_ID.MAPPING,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function insertFlowPairMappingEvent(state, snapshot) {
  state.events.splice(snapshot.eventsLength, 0, {
    type: EVENT_ID.MAPPING,
    start: snapshot.position,
    anchorStart: NO_RANGE$1,
    anchorEnd: NO_RANGE$1,
    tagStart: NO_RANGE$1,
    tagEnd: NO_RANGE$1,
    style: COLLECTION_STYLE.FLOW
  });
}
function addScalarEvent(state, valueStart, valueEnd, anchorStart, anchorEnd, tagStart, tagEnd, style, chomping = CHOMPING_MODE.CLIP, indent = -1, fast = false) {
  state.events.push({
    type: EVENT_ID.SCALAR,
    valueStart,
    valueEnd,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style,
    chomping,
    indent,
    fast
  });
}
function addAliasEvent(state, anchorStart, anchorEnd) {
  state.events.push({
    type: EVENT_ID.ALIAS,
    anchorStart,
    anchorEnd
  });
}
function addPopEvent(state) {
  state.events.push({ type: EVENT_ID.POP });
}
function addEmptyScalarEvent(state) {
  addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, SCALAR_STYLE.PLAIN);
}
function emptyProperties() {
  return {
    anchorStart: NO_RANGE$1,
    anchorEnd: NO_RANGE$1,
    tagStart: NO_RANGE$1,
    tagEnd: NO_RANGE$1
  };
}
function snapshotState(state) {
  return {
    position: state.position,
    line: state.line,
    lineStart: state.lineStart,
    lineIndent: state.lineIndent,
    firstTabInLine: state.firstTabInLine,
    eventsLength: state.events.length
  };
}
function restoreState(state, snapshot) {
  state.position = snapshot.position;
  state.line = snapshot.line;
  state.lineStart = snapshot.lineStart;
  state.lineIndent = snapshot.lineIndent;
  state.firstTabInLine = snapshot.firstTabInLine;
  state.events.length = snapshot.eventsLength;
}
function throwError(state, message) {
  YAMLException.throwAt(state.input.slice(0, state.length), state.position, message, state.filename);
}
function isEol(c) {
  return c === 10 || c === 13;
}
function isWhiteSpace(c) {
  return c === 9 || c === 32;
}
function isWsOrEol(c) {
  return isWhiteSpace(c) || isEol(c);
}
function isWsOrEolOrEnd(c) {
  return c === 0 || isWsOrEol(c);
}
function isFlowIndicator(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromDecimalCode(c) {
  return c >= 48 && c <= 57 ? c - 48 : -1;
}
function fromHexCode(c) {
  if (c >= 48 && c <= 57) return c - 48;
  const lc = c | 32;
  if (lc >= 97 && lc <= 102) return lc - 97 + 10;
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) return 2;
  if (c === 117) return 4;
  if (c === 85) return 8;
  return 0;
}
function isSimpleEscape(c) {
  return c === 48 || c === 97 || c === 98 || c === 116 || c === 9 || c === 110 || c === 118 || c === 102 || c === 114 || c === 101 || c === 32 || c === 34 || c === 47 || c === 92 || c === 78 || c === 95 || c === 76 || c === 80;
}
function consumeLineBreak(state) {
  if (state.input.charCodeAt(state.position) === 10) state.position++;
  else {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) state.position++;
  }
  state.line++;
  state.lineStart = state.position;
  state.lineIndent = 0;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments) {
  let lineBreaks = 0;
  let ch = state.input.charCodeAt(state.position);
  let hasSeparation = state.position === state.lineStart || isWsOrEol(state.input.charCodeAt(state.position - 1));
  while (ch !== 0) {
    while (isWhiteSpace(ch)) {
      hasSeparation = true;
      if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && hasSeparation && ch === 35) do
      ch = state.input.charCodeAt(++state.position);
    while (!isEol(ch) && ch !== 0);
    if (!isEol(ch)) break;
    consumeLineBreak(state);
    lineBreaks++;
    hasSeparation = true;
    ch = state.input.charCodeAt(state.position);
    while (ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
  }
  return lineBreaks;
}
function testDocumentSeparator(state, position = state.position) {
  const ch = state.input.charCodeAt(position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(position + 1) && ch === state.input.charCodeAt(position + 2)) {
    const following = state.input.charCodeAt(position + 3);
    return following === 0 || isWsOrEol(following);
  }
  return false;
}
function skipByteOrderMark(state) {
  if (state.position === state.lineStart && state.input.charCodeAt(state.position) === 65279) {
    state.position++;
    state.lineStart = state.position;
  }
}
function testDocumentBoundary(state) {
  if (state.position !== state.lineStart) return false;
  if (testDocumentSeparator(state)) return true;
  if (state.input.charCodeAt(state.position) !== 65279) return false;
  const snapshot = snapshotState(state);
  skipByteOrderMark(state);
  skipSeparationSpace(state, true);
  const ch = state.input.charCodeAt(state.position);
  const result = state.position === state.lineStart && (ch === 37 || ch === 45 && testDocumentSeparator(state));
  restoreState(state, snapshot);
  return result;
}
function skipUntilLineEnd(state) {
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0 && !isEol(ch)) ch = state.input.charCodeAt(++state.position);
}
function checkPrintable(state, start, end) {
  if (PATTERN_NON_PRINTABLE.test(state.input.slice(start, end))) throwError(state, "the stream contains non-printable characters");
}
function readTagProperty(state, props, inFlow) {
  if (state.input.charCodeAt(state.position) !== 33) return false;
  if (props.tagStart !== NO_RANGE$1) throwError(state, "duplication of a tag property");
  const start = state.position;
  let isVerbatim = false;
  let isNamed = false;
  let tagHandle = "!";
  let ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  }
  let suffixStart = state.position;
  let tagName;
  if (isVerbatim) {
    while (ch !== 0 && ch !== 62) ch = state.input.charCodeAt(++state.position);
    if (ch !== 62) throwError(state, "unexpected end of the stream within a verbatim tag");
    tagName = state.input.slice(suffixStart, state.position);
    state.position++;
  } else {
    while (ch !== 0 && !isWsOrEol(ch) && !(inFlow && isFlowIndicator(ch))) {
      if (ch === 33) if (!isNamed) {
        tagHandle = state.input.slice(suffixStart - 1, state.position + 1);
        if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
        isNamed = true;
        suffixStart = state.position + 1;
      } else throwError(state, "tag suffix cannot contain exclamation marks");
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(suffixStart, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
  }
  if (tagName && !(isVerbatim ? PATTERN_TAG_URI.test(tagName) : PATTERN_TAG_SUFFIX.test(tagName))) throwError(state, `tag name cannot contain such characters: ${tagName}`);
  if (!isVerbatim && tagHandle !== "!" && tagHandle !== "!!" && !HAS_OWN.call(state.tagHandlers, tagHandle)) throwError(state, `undeclared tag handle "${tagHandle}"`);
  props.tagStart = start;
  props.tagEnd = state.position;
  return true;
}
function readAnchorProperty(state, props) {
  if (state.input.charCodeAt(state.position) !== 38) return false;
  if (props.anchorStart !== NO_RANGE$1) throwError(state, "duplication of an anchor property");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an anchor node must contain at least one character");
  props.anchorStart = start;
  props.anchorEnd = state.position;
  return true;
}
function readAlias(state, props) {
  if (state.input.charCodeAt(state.position) !== 42) return false;
  if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) throwError(state, "alias node should not have any properties");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an alias node must contain at least one character");
  addAliasEvent(state, start, state.position);
  return true;
}
function readFlowScalarBreak(state, nodeIndent) {
  skipSeparationSpace(state, false);
  if (state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readSingleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 39) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 39) {
      if (state.input.charCodeAt(state.position + 1) === 39) {
        simple = false;
        state.position += 2;
        continue;
      }
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.SINGLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
      return true;
    }
    if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 34) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 34) {
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.DOUBLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
      return true;
    }
    if (ch === 92) {
      simple = false;
      const escaped = state.input.charCodeAt(++state.position);
      if (isEol(escaped)) readFlowScalarBreak(state, nodeIndent);
      else if (isSimpleEscape(escaped)) state.position++;
      else {
        let hexLength = escapedHexLen(escaped);
        if (hexLength === 0) throwError(state, "unknown escape sequence");
        while (hexLength-- > 0) {
          state.position++;
          if (fromHexCode(state.input.charCodeAt(state.position)) < 0) throwError(state, "expected hexadecimal character");
        }
        state.position++;
      }
    } else if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readBlockScalar(state, parentIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  let chomping = CHOMPING_MODE.CLIP;
  let indent = -1;
  let detectedIndent = false;
  if (ch !== 124 && ch !== 62) return false;
  const style = ch === 124 ? SCALAR_STYLE.LITERAL_BLOCK : SCALAR_STYLE.FOLDED_BLOCK;
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    const current = state.input.charCodeAt(state.position);
    const digit = fromDecimalCode(current);
    if (current === 43 || current === 45) {
      if (chomping !== CHOMPING_MODE.CLIP) throwError(state, "repeat of a chomping mode identifier");
      chomping = current === 43 ? CHOMPING_MODE.KEEP : CHOMPING_MODE.STRIP;
      state.position++;
    } else if (digit >= 0) {
      if (digit === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      if (detectedIndent) throwError(state, "repeat of an indentation width identifier");
      indent = parentIndent + digit - 1;
      detectedIndent = true;
      state.position++;
    } else break;
  }
  let hadWhitespace = false;
  while (isWhiteSpace(state.input.charCodeAt(state.position))) {
    hadWhitespace = true;
    state.position++;
  }
  if (hadWhitespace && state.input.charCodeAt(state.position) === 35) skipUntilLineEnd(state);
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  else if (state.input.charCodeAt(state.position) !== 0) throwError(state, "a line break is expected");
  let contentIndent = detectedIndent ? indent : -1;
  let maxLeadingIndent = 0;
  const valueStart = state.position;
  let valueEnd = state.position;
  while (state.input.charCodeAt(state.position) !== 0) {
    const linePosition = state.position;
    let column = 0;
    while (state.input.charCodeAt(linePosition + column) === 32) column++;
    const first = state.input.charCodeAt(linePosition + column);
    if (first === 0) {
      if (contentIndent >= 0) {
        if (column > contentIndent) valueEnd = linePosition + column;
      } else if (column > 0) valueEnd = linePosition + column;
      break;
    }
    if (testDocumentBoundary(state)) break;
    if (!detectedIndent && contentIndent === -1 && isEol(first)) maxLeadingIndent = Math.max(maxLeadingIndent, column);
    if (!detectedIndent && contentIndent === -1 && !isEol(first)) {
      if (first === 9 && column < parentIndent) {
        state.position = linePosition + column;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (column < maxLeadingIndent) {
        state.position = linePosition + column;
        throwError(state, "bad indentation of a mapping entry");
      }
    }
    if (contentIndent === -1 && first !== 0 && !isEol(first) && column < parentIndent) {
      state.lineIndent = column;
      state.position = linePosition + column;
      break;
    }
    if (!detectedIndent && first !== 0 && !isEol(first) && contentIndent === -1) contentIndent = column;
    const requiredIndent = contentIndent === -1 ? parentIndent + 1 : contentIndent;
    if (first !== 0 && !isEol(first) && column < requiredIndent) {
      state.lineIndent = column;
      state.position = linePosition + column;
      break;
    }
    skipUntilLineEnd(state);
    valueEnd = state.position;
    if (isEol(state.input.charCodeAt(state.position))) {
      consumeLineBreak(state);
      valueEnd = state.position;
    }
  }
  checkPrintable(state, valueStart, valueEnd);
  addScalarEvent(state, valueStart, valueEnd, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, style, chomping, contentIndent);
  return true;
}
function canStartPlainScalar(state, nodeContext) {
  const ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  if (ch === 0 || isWsOrEol(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96 || inFlow && isFlowIndicator(ch)) return false;
  if (ch === 63 || ch === 45) {
    const following = state.input.charCodeAt(state.position + 1);
    if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) return false;
  }
  return true;
}
function readPlainScalar(state, nodeIndent, nodeContext, props) {
  if (!canStartPlainScalar(state, nodeContext)) return false;
  const start = state.position;
  let end = state.position;
  let ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  let multiline = false;
  while (ch !== 0) {
    if (testDocumentBoundary(state)) break;
    if (ch === 58) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) break;
    } else if (ch === 35) {
      if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
    } else if (inFlow && isFlowIndicator(ch)) break;
    else if (isEol(ch)) {
      const savedPosition = state.position;
      const savedLine = state.line;
      const savedLineStart = state.lineStart;
      const savedLineIndent = state.lineIndent;
      skipSeparationSpace(state, false);
      if (state.lineIndent >= nodeIndent) {
        multiline = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      }
      state.position = savedPosition;
      state.line = savedLine;
      state.lineStart = savedLineStart;
      state.lineIndent = savedLineIndent;
      break;
    }
    if (!isWhiteSpace(ch)) end = state.position + 1;
    ch = state.input.charCodeAt(++state.position);
  }
  if (end === start) return false;
  checkPrintable(state, start, end);
  addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN, CHOMPING_MODE.CLIP, -1, !multiline);
  return true;
}
function skipFlowSeparationSpace(state, nodeIndent) {
  const startLine = state.line;
  skipSeparationSpace(state, true);
  if (state.line > startLine && state.lineIndent < nodeIndent || state.firstTabInLine !== -1 && state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readFlowCollection(state, nodeIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  const isMapping = ch === 123;
  const start = state.position;
  let readNext = true;
  if (ch !== 91 && ch !== 123) return false;
  const terminator = isMapping ? 125 : 93;
  if (isMapping) addMappingEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
  else addSequenceEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    skipFlowSeparationSpace(state, nodeIndent);
    let ch2 = state.input.charCodeAt(state.position);
    if (ch2 === terminator) {
      state.position++;
      addPopEvent(state);
      return true;
    } else if (!readNext) throwError(state, "missed comma between flow collection entries");
    else if (ch2 === 44) throwError(state, "expected the node content, but found ','");
    let isPair = false;
    let isExplicitPair = false;
    if (ch2 === 63 && isWsOrEol(state.input.charCodeAt(state.position + 1))) {
      isPair = isExplicitPair = true;
      state.position += 1;
      skipFlowSeparationSpace(state, nodeIndent);
    }
    const entryLine = state.line;
    const entryStart = snapshotState(state);
    const keyWasRead = parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    skipFlowSeparationSpace(state, nodeIndent);
    ch2 = state.input.charCodeAt(state.position);
    if ((isMapping || isExplicitPair || state.line === entryLine) && ch2 === 58) {
      isPair = true;
      state.position++;
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) {
        insertFlowPairMappingEvent(state, entryStart);
        if (!keyWasRead) addEmptyScalarEvent(state);
      } else if (!keyWasRead) addEmptyScalarEvent(state);
      if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) addEmptyScalarEvent(state);
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) addPopEvent(state);
    } else if (isMapping && isPair) {
      if (!keyWasRead) addEmptyScalarEvent(state);
      addEmptyScalarEvent(state);
    } else if (isMapping) addEmptyScalarEvent(state);
    else if (isPair) {
      insertFlowPairMappingEvent(state, entryStart);
      if (!keyWasRead) addEmptyScalarEvent(state);
      addEmptyScalarEvent(state);
      addPopEvent(state);
    }
    ch2 = state.input.charCodeAt(state.position);
    if (ch2 === 44) {
      readNext = true;
      state.position++;
    } else readNext = false;
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockSequence(state, nodeIndent, props) {
  if (state.firstTabInLine !== -1 || state.input.charCodeAt(state.position) !== 45 || !isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) return false;
  addSequenceEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
  while (state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const entryLine = state.line;
    state.position++;
    const hadBreak = skipSeparationSpace(state, true) > 0;
    if (state.firstTabInLine !== -1 && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
    if (hadBreak && state.lineIndent <= nodeIndent) addEmptyScalarEvent(state);
    else parseNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    skipSeparationSpace(state, true);
    if (state.lineIndent < nodeIndent || state.position >= state.length) break;
    if (state.lineIndent > nodeIndent) throwError(state, "bad indentation of a sequence entry");
    if (state.line === entryLine && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
  }
  addPopEvent(state);
  return true;
}
function readBlockMapping(state, nodeIndent, flowIndent, props) {
  let atExplicitKey = false;
  let detected = false;
  let mappingOpened = false;
  let pendingExplicitKey = false;
  if (state.firstTabInLine !== -1) return false;
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const following = state.input.charCodeAt(state.position + 1);
    const entryLine = state.line;
    if ((ch === 63 || ch === 58) && isWsOrEolOrEnd(following)) {
      if (!mappingOpened) {
        addMappingEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
        mappingOpened = true;
      }
      if (ch === 63) {
        if (atExplicitKey) addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = true;
      } else if (atExplicitKey) atExplicitKey = false;
      else {
        addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = false;
      }
      state.position += 1;
      pendingExplicitKey = true;
    } else {
      if (atExplicitKey) {
        addEmptyScalarEvent(state);
        atExplicitKey = false;
      }
      const beforeKey = snapshotState(state);
      if (!parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
      if (state.line === entryLine) {
        ch = state.input.charCodeAt(state.position);
        while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!isWsOrEolOrEnd(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          if (!mappingOpened) {
            restoreState(state, beforeKey);
            addMappingEvent(state, beforeKey.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
            mappingOpened = true;
            parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true);
            ch = state.input.charCodeAt(state.position);
            while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
            state.position++;
          }
          detected = true;
          atExplicitKey = false;
          pendingExplicitKey = false;
        } else if (detected) throwError(state, "expected ':' after a mapping key");
        else {
          if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
            restoreState(state, beforeKey);
            return false;
          }
          return true;
        }
      } else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else {
        if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
          restoreState(state, beforeKey);
          return false;
        }
        return true;
      }
    }
    if (parseNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, pendingExplicitKey)) pendingExplicitKey = false;
    if (!atExplicitKey) {
      if (pendingExplicitKey) {
        addEmptyScalarEvent(state);
        pendingExplicitKey = false;
      }
    }
    skipSeparationSpace(state, true);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === entryLine || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
    else if (state.lineIndent < nodeIndent) break;
  }
  if (!detected) return false;
  if (atExplicitKey) addEmptyScalarEvent(state);
  if (mappingOpened) addPopEvent(state);
  return true;
}
function parseNode(state, parentIndent, nodeContext, allowToSeek, allowCompact, allowPropertyMapping = true) {
  if (state.depth >= state.maxDepth) throwError(state, `nesting exceeded maxDepth (${state.maxDepth})`);
  state.depth++;
  let indentStatus = 1;
  let atNewLine = false;
  let hasContent = false;
  let propertyStart = null;
  const props = emptyProperties();
  let allowBlockScalars = nodeContext === CONTEXT_BLOCK_OUT || nodeContext === CONTEXT_BLOCK_IN;
  let allowBlockCollections = allowBlockScalars;
  const allowBlockStyles = allowBlockScalars;
  if (allowToSeek && skipSeparationSpace(state, true)) {
    atNewLine = true;
    if (state.lineIndent > parentIndent) indentStatus = 1;
    else if (state.lineIndent === parentIndent) indentStatus = 0;
    else indentStatus = -1;
  }
  if (indentStatus === 1) while (true) {
    const ch = state.input.charCodeAt(state.position);
    const propertyState = snapshotState(state);
    if (atNewLine && indentStatus !== 1 && (ch === 33 || ch === 38)) break;
    if (atNewLine && allowBlockStyles && (props.tagStart !== NO_RANGE$1 || props.anchorStart !== NO_RANGE$1) && (ch === 33 || ch === 38)) {
      const fallbackState = snapshotState(state);
      const flowIndent = parentIndent + 1;
      if (readBlockMapping(state, state.position - state.lineStart, flowIndent, props) && state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) {
        state.depth--;
        return true;
      }
      restoreState(state, fallbackState);
    }
    if (atNewLine && (ch === 33 && props.tagStart !== NO_RANGE$1 || ch === 38 && props.anchorStart !== NO_RANGE$1)) break;
    if (!readTagProperty(state, props, nodeContext === CONTEXT_FLOW_IN) && !readAnchorProperty(state, props)) break;
    if (propertyStart === null) propertyStart = propertyState;
    if (skipSeparationSpace(state, true)) {
      atNewLine = true;
      allowBlockCollections = allowBlockStyles;
      if (state.lineIndent > parentIndent) indentStatus = 1;
      else if (state.lineIndent === parentIndent) indentStatus = 0;
      else indentStatus = -1;
    } else allowBlockCollections = false;
  }
  if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
  if (indentStatus === 1 || nodeContext === CONTEXT_BLOCK_OUT) {
    const flowIndent = nodeContext === CONTEXT_FLOW_IN || nodeContext === CONTEXT_FLOW_OUT ? parentIndent : parentIndent + 1;
    const blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) if (allowBlockCollections && (readBlockSequence(state, blockIndent, props) || readBlockMapping(state, blockIndent, flowIndent, props)) || readFlowCollection(state, flowIndent, props)) hasContent = true;
    else {
      const ch = state.input.charCodeAt(state.position);
      if (propertyStart !== null && allowPropertyMapping && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62) {
        const fallbackState = snapshotState(state);
        const propertyIndent = propertyStart.position - propertyStart.lineStart;
        restoreState(state, propertyStart);
        if (readBlockMapping(state, propertyIndent, flowIndent, emptyProperties()) && state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) hasContent = true;
        else restoreState(state, fallbackState);
      }
      if (!hasContent && (allowBlockScalars && readBlockScalar(state, flowIndent, props) || readSingleQuotedScalar(state, flowIndent, props) || readDoubleQuotedScalar(state, flowIndent, props) || readAlias(state, props) || readPlainScalar(state, flowIndent, nodeContext, props))) hasContent = true;
    }
    else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent, props);
  }
  allowBlockScalars = allowBlockScalars && !hasContent;
  if (!hasContent && (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1 || allowBlockScalars)) {
    addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN);
    hasContent = true;
  }
  state.depth--;
  return hasContent || props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1;
}
function readDirective(state) {
  if (state.lineIndent > 0 || state.input.charCodeAt(state.position) !== 37) return false;
  state.position++;
  const nameStart = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
  const name = state.input.slice(nameStart, state.position);
  const args = [];
  if (name.length === 0) throwError(state, "directive name must not be less than one character in length");
  while (state.input.charCodeAt(state.position) !== 0 && !isEol(state.input.charCodeAt(state.position))) {
    while (isWhiteSpace(state.input.charCodeAt(state.position))) state.position++;
    if (state.input.charCodeAt(state.position) === 35 || isEol(state.input.charCodeAt(state.position)) || state.input.charCodeAt(state.position) === 0) break;
    const start = state.position;
    while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
    args.push(state.input.slice(start, state.position));
  }
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  if (name === "YAML") {
    if (state.directives.some((directive) => directive.kind === "yaml")) throwError(state, "duplication of %YAML directive");
    if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
    const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) throwError(state, "ill-formed argument of the YAML directive");
    if (parseInt(match[1], 10) !== 1) throwError(state, "unacceptable YAML version of the document");
    state.directives.push({
      kind: "yaml",
      version: args[0]
    });
  } else if (name === "TAG") {
    if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
    const [handle, prefix] = args;
    if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    if (HAS_OWN.call(state.tagHandlers, handle)) throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);
    if (!PATTERN_TAG_PREFIX.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    state.tagHandlers[handle] = prefix;
    state.directives.push({
      kind: "tag",
      handle,
      prefix
    });
  }
  return true;
}
function readDocument(state) {
  state.directives = [];
  state.tagHandlers = /* @__PURE__ */ Object.create(null);
  let hasDirectives = false;
  skipSeparationSpace(state, true);
  while (readDirective(state)) {
    hasDirectives = true;
    skipSeparationSpace(state, true);
  }
  let explicitStart = false;
  let explicitEnd = false;
  let allowCompact = true;
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 3))) {
    explicitStart = true;
    const markerLine = state.line;
    state.position += 3;
    skipSeparationSpace(state, true);
    allowCompact = state.line > markerLine;
  } else if (hasDirectives) throwError(state, "directives end mark is expected");
  const documentEventIndex = state.events.length;
  if (!explicitStart && state.position === state.lineStart && state.input.charCodeAt(state.position) === 46 && testDocumentSeparator(state)) {
    state.position += 3;
    skipSeparationSpace(state, true);
    return;
  }
  addDocumentEvent(state, explicitStart, false);
  if (!parseNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, allowCompact, allowCompact)) addEmptyScalarEvent(state);
  skipSeparationSpace(state, true);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    explicitEnd = state.input.charCodeAt(state.position) === 46;
    if (explicitEnd) {
      const markerLine = state.line;
      state.position += 3;
      skipSeparationSpace(state, true);
      if (state.line === markerLine && state.position < state.length) throwError(state, "end of the stream or a document separator is expected");
    }
  }
  const documentEvent = state.events[documentEventIndex];
  if (documentEvent?.type === EVENT_ID.DOCUMENT) documentEvent.explicitEnd = explicitEnd;
  addPopEvent(state);
  if (!explicitEnd && state.position < state.length && !testDocumentBoundary(state)) throwError(state, "end of the stream or a document separator is expected");
}
function parseEvents(input, options) {
  const length = input.length;
  const state = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options,
    input: `${input}\0`,
    length,
    position: 0,
    line: 0,
    lineStart: 0,
    lineIndent: 0,
    firstTabInLine: -1,
    depth: 0,
    directives: [],
    tagHandlers: /* @__PURE__ */ Object.create(null),
    events: []
  };
  const nullpos = input.indexOf("\0");
  if (nullpos !== -1) YAMLException.throwAt(input, nullpos, "null byte is not allowed in input", state.filename);
  while (state.position < state.length) {
    skipByteOrderMark(state);
    skipSeparationSpace(state, true);
    if (state.position >= state.length) break;
    const documentStart = state.position;
    readDocument(state);
    if (state.position === documentStart)
      throwError(state, "can not read a document");
  }
  return state.events;
}
var DEFAULT_LOAD_OPTIONS = {
  ...DEFAULT_PARSER_OPTIONS,
  ...DEFAULT_CONSTRUCTOR_OPTIONS
};
function loadDocuments(input, options = {}) {
  const opts = {
    ...DEFAULT_LOAD_OPTIONS,
    ...options
  };
  const source = String(input);
  const PARSER_OPT_KEYS = Object.keys(DEFAULT_PARSER_OPTIONS);
  const CONSTRUCTOR_OPT_KEYS = Object.keys(DEFAULT_CONSTRUCTOR_OPTIONS);
  return constructFromEvents(parseEvents(source, pick(opts, PARSER_OPT_KEYS)), {
    ...pick(opts, CONSTRUCTOR_OPT_KEYS),
    source
  });
}
function load(input, options) {
  const documents = loadDocuments(input, options);
  if (documents.length === 0) throw new YAMLException("expected a document, but the input is empty");
  if (documents.length === 1) return documents[0];
  throw new YAMLException("expected a single document in the stream, but found more");
}
var INVALID2 = Symbol("INVALID");
var VISIT_BREAK = Symbol("visit:break");
var VISIT_SKIP = Symbol("visit:skip");
function hasBit(mask, bit) {
  return (mask & 1 << bit) !== 0;
}
var DEFAULT_SCALAR_STYLE_RULES = {
  applyQuoteFlowKeysOption,
  doubleQuoteForInvisibles,
  doubleQuoteWhitespaceOnly,
  applyForceQuotesOption,
  tryLongOrMultilineAsBlock,
  quoteInvalidPlain,
  fallbackToDoubleQuoted
};
function _preferredQuotedStyle(layout2) {
  if (layout2.presenterOptions.quoteStyle === "single" && hasBit(layout2.allowedStylesMask, SCALAR_STYLE.SINGLE_QUOTED)) return SCALAR_STYLE.SINGLE_QUOTED;
  return SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyQuoteFlowKeysOption(layout2) {
  if (!layout2.presenterOptions.quoteFlowKeys) return;
  if (!layout2.isKey || !layout2.flowOnly || layout2.style !== SCALAR_STYLE.PLAIN) return;
  layout2.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteForInvisibles(layout2) {
  if (layout2.style === SCALAR_STYLE.PLAIN && /[\t\x7F-\xA0\u2028\u2029\uFEFF\uFFFE\uFFFF]/.test(layout2.node.value)) layout2.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteWhitespaceOnly(layout2) {
  if (layout2.style === SCALAR_STYLE.PLAIN && /^\s+$/.test(layout2.node.value)) layout2.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyForceQuotesOption(layout2) {
  if (!layout2.presenterOptions.forceQuotes) return;
  if (layout2.isKey || layout2.style !== SCALAR_STYLE.PLAIN) return;
  if (layout2.node.tag !== layout2.presenterOptions.schema.defaultScalarTag.tagName) return;
  layout2.style = layout2.node.value.includes("\n") ? SCALAR_STYLE.DOUBLE_QUOTED : _preferredQuotedStyle(layout2);
}
function tryLongOrMultilineAsBlock(layout2) {
  if (layout2.style !== SCALAR_STYLE.PLAIN || layout2.isKey) return;
  const value = layout2.node.value;
  const multiline = value.indexOf("\n") !== -1;
  if (!hasBit(layout2.allowedStylesMask, SCALAR_STYLE.LITERAL_BLOCK)) {
    if (multiline) layout2.style = SCALAR_STYLE.DOUBLE_QUOTED;
    return;
  }
  const w = layout2.presenterOptions.lineWidth;
  if (w === -1) {
    if (multiline) layout2.style = SCALAR_STYLE.LITERAL_BLOCK;
    return;
  }
  const availableWidth = Math.max(Math.min(w, 40), w - layout2.shiftOfContent);
  let position = 0;
  let shouldFold = false;
  while (position <= value.length) {
    let lineEnd = value.length;
    const nextLineBreak = value.indexOf("\n", position);
    if (nextLineBreak !== -1) lineEnd = nextLineBreak;
    const line = value.slice(position, lineEnd);
    if (line.length > availableWidth && line[0] !== " " && / [^ \t]/.test(line)) shouldFold = true;
    if (nextLineBreak === -1) break;
    position = nextLineBreak + 1;
  }
  if (shouldFold) layout2.style = SCALAR_STYLE.FOLDED_BLOCK;
  else if (multiline) layout2.style = SCALAR_STYLE.LITERAL_BLOCK;
}
function quoteInvalidPlain(layout2) {
  if (layout2.style === SCALAR_STYLE.PLAIN && !hasBit(layout2.allowedStylesMask, SCALAR_STYLE.PLAIN)) layout2.style = _preferredQuotedStyle(layout2);
}
function fallbackToDoubleQuoted(layout2) {
  if (!hasBit(layout2.allowedStylesMask, layout2.style)) layout2.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
var SRC_C_PRINTABLE = "[\\x09\\x0A\\x0D\\x20-\\x7E\\x85\\xA0-\\uD7FF\\uE000-\\uFFFD\\u{10000}-\\u{10FFFF}]";
var SRC_B_CHAR = "[\\n\\r]";
var SRC_C_BYTE_ORDER_MARK = "\\uFEFF";
var SRC_S_WHITE = "[ \\t]";
var SRC_NB_CHAR = `(?:(?!(?:${SRC_B_CHAR}|${SRC_C_BYTE_ORDER_MARK}))${SRC_C_PRINTABLE})`;
var SRC_NS_CHAR = `(?:(?!${SRC_S_WHITE})${SRC_NB_CHAR})`;
var SRC_NB_JSON = "[\\x09\\x20-\\uD7FF\\uE000-\\uFFFF\\u{10000}-\\u{10FFFF}]";
var SRC_C_INDICATOR = "[-?:,\\[\\]{}#&*!|>'\"%@`]";
var SRC_C_FLOW_INDICATOR = "[,\\[\\]{}]";
var SRC_NS_PLAIN_SAFE_FLOW_OUT = SRC_NS_CHAR;
var SRC_NS_PLAIN_SAFE_FLOW_IN = `(?:(?!${SRC_C_FLOW_INDICATOR})${SRC_NS_CHAR})`;
var SRC_NS_PLAIN_FIRST_FLOW_OUT = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))`;
var SRC_NS_PLAIN_FIRST_FLOW_IN = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))`;
var SRC_NS_PLAIN_CHAR_FLOW_OUT = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_OUT})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))#*`;
var SRC_NS_PLAIN_CHAR_FLOW_IN = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_IN})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))#*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_OUT})*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_IN})*`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_OUT = `${SRC_NS_PLAIN_FIRST_FLOW_OUT}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_IN = `${SRC_NS_PLAIN_FIRST_FLOW_IN}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_OUT;
var SRC_NS_PLAIN_ONE_LINE_FLOW_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_IN;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_OUT}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_IN}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT = `${SRC_NS_PLAIN_ONE_LINE_FLOW_OUT}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT})*`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_IN = `${SRC_NS_PLAIN_ONE_LINE_FLOW_IN}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN})*`;
var NS_PLAIN_FLOW_OUT = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT})$`, "u");
var NS_PLAIN_FLOW_IN = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_IN})$`, "u");
var NS_PLAIN_BLOCK_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY})$`, "u");
var NS_PLAIN_FLOW_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_FLOW_KEY})$`, "u");
var NB_SINGLE_ONE_LINE = new RegExp(`^(?:${SRC_NB_JSON})*$`, "u");
var NB_SINGLE_MULTI_LINE = new RegExp(`^(?:${SRC_NB_JSON}|\\n)*$`, "u");
var BLOCK_SCALAR_CONTENT = new RegExp(`^(?:${SRC_NB_CHAR}|\\n)*$`, "u");
var DEFAULT_PRESENTER_OPTIONS = {
  indent: 2,
  seqNoIndent: false,
  seqInlineFirst: true,
  lineWidth: 80,
  flowBracketPadding: false,
  flowSkipCommaSpace: false,
  flowSkipColonSpace: false,
  quoteFlowKeys: false,
  quoteStyle: "single",
  forceQuotes: false,
  scalarStyleRules: Object.keys(DEFAULT_SCALAR_STYLE_RULES).map((name) => Reflect.get(DEFAULT_SCALAR_STYLE_RULES, name)),
  tagBeforeAnchor: false
};
var DEFAULT_DUMP_OPTIONS = {
  ...DEFAULT_PRESENTER_OPTIONS,
  schema: DUMP_SCHEMA,
  skipInvalid: false,
  noRefs: false,
  flowLevel: -1,
  sortKeys: false,
  transform: () => {
  }
};
var EVENT_DOCUMENT = EVENT_ID.DOCUMENT;
var EVENT_SEQUENCE = EVENT_ID.SEQUENCE;
var EVENT_MAPPING = EVENT_ID.MAPPING;
var EVENT_SCALAR = EVENT_ID.SCALAR;
var EVENT_ALIAS = EVENT_ID.ALIAS;
var EVENT_POP = EVENT_ID.POP;
var SCALAR_STYLE_PLAIN = SCALAR_STYLE.PLAIN;
var SCALAR_STYLE_SINGLE_QUOTED = SCALAR_STYLE.SINGLE_QUOTED;
var SCALAR_STYLE_DOUBLE_QUOTED = SCALAR_STYLE.DOUBLE_QUOTED;
var SCALAR_STYLE_LITERAL_BLOCK = SCALAR_STYLE.LITERAL_BLOCK;
var SCALAR_STYLE_FOLDED_BLOCK = SCALAR_STYLE.FOLDED_BLOCK;
var COLLECTION_STYLE_BLOCK = COLLECTION_STYLE.BLOCK;
var COLLECTION_STYLE_FLOW = COLLECTION_STYLE.FLOW;
var CHOMPING_CLIP = CHOMPING_MODE.CLIP;
var CHOMPING_STRIP = CHOMPING_MODE.STRIP;
var CHOMPING_KEEP = CHOMPING_MODE.KEEP;

// ../../plugins/jira/src/template/types.ts
var TEMPLATE_KINDS = ["work-item", "comment", "pull-request"];
var FIELD_FORMATS = ["prose", "bullets", "labelled"];
var TemplateInvalidError = class extends Error {
  constructor(path8, documentPath, message) {
    super(message);
    this.path = path8;
    this.documentPath = documentPath;
    this.name = "TemplateInvalidError";
  }
  get detail() {
    return `${this.path}: ${this.documentPath}: ${this.message}`;
  }
};
var TemplateNotFoundError = class extends Error {
  constructor(kind, templateName2, names) {
    super(`No ${kind} template named "${templateName2}". Templates: ${names.join(", ")}.`);
    this.kind = kind;
    this.templateName = templateName2;
    this.names = names;
    this.name = "TemplateNotFoundError";
  }
};

// ../../plugins/jira/src/template/parse.ts
var MAX_TEMPLATE_BYTES = 16 * 1024;
var NAME = /^[a-z][a-z0-9-]*$/;
function isTemplateName(name) {
  return NAME.test(name);
}
var PLACEHOLDER2 = /\{\{[^{}]*\}\}/g;
var PLACEHOLDER_NAME = /^\{\{([A-Za-z][A-Za-z0-9.-]*)\}\}$/;
var FIELD_PREFIX2 = "field.";
var TOP_KEYS = ["schema", "kind", "description", "work-type", "required", "fields", "body"];
var FIELD_KEYS = ["name", "format", "heading", "guidance", "length", "labels"];
var LENGTH_KEYS = ["unit", "min", "max", "severity"];
var UNITS = {
  prose: ["words", "sentences"],
  bullets: ["items"],
  labelled: ["words", "sentences"]
};
function isMap(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalize(text6) {
  return text6.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}
function documentMap(text6, label) {
  let value;
  try {
    value = load(normalize(text6), { schema: JSON_SCHEMA });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new TemplateInvalidError(label, "document", `The file is not valid YAML: ${reason}`);
  }
  if (!isMap(value)) {
    throw new TemplateInvalidError(label, "document", "The document is not a map of keys.");
  }
  return value;
}
function peekKind(text6) {
  try {
    const kind = documentMap(text6, "").kind;
    return TEMPLATE_KINDS.find((candidate) => candidate === kind) ?? null;
  } catch {
    return null;
  }
}
function checkKeys(map, allowed, at2, label) {
  for (const key of Object.keys(map)) {
    if (!allowed.includes(key)) {
      throw new TemplateInvalidError(
        label,
        at2 === "" ? key : `${at2}.${key}`,
        `Unknown key \`${key}\`. Allowed: ${allowed.join(", ")}.`
      );
    }
  }
}
function nonEmptyString(value, at2, label, what) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TemplateInvalidError(label, at2, `${what} is a non-empty string.`);
  }
  return value;
}
function count(value, at2, label) {
  if (value === void 0) return void 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new TemplateInvalidError(label, at2, "A length bound is a whole number, zero or more.");
  }
  return value;
}
function parseLength(value, format, at2, label) {
  if (!isMap(value)) throw new TemplateInvalidError(label, at2, "`length` is a map.");
  checkKeys(value, LENGTH_KEYS, at2, label);
  const allowed = UNITS[format];
  const unit = allowed.find((candidate) => candidate === value.unit);
  if (unit === void 0) {
    throw new TemplateInvalidError(
      label,
      `${at2}.unit`,
      `\`unit\` does not fit a ${format} field. Expected ${allowed.join(" or ")}.`
    );
  }
  const severity = value.severity ?? "warn";
  if (severity !== "warn" && severity !== "fail") {
    throw new TemplateInvalidError(label, `${at2}.severity`, "`severity` is `warn` or `fail`.");
  }
  const min = count(value.min, `${at2}.min`, label);
  const max = count(value.max, `${at2}.max`, label);
  if (min === void 0 && max === void 0) {
    throw new TemplateInvalidError(label, at2, "`length` needs a `min`, a `max`, or both.");
  }
  if (min !== void 0 && max !== void 0 && min > max) {
    throw new TemplateInvalidError(label, `${at2}.min`, "`min` is over `max`.");
  }
  return {
    unit,
    ...min !== void 0 ? { min } : {},
    ...max !== void 0 ? { max } : {},
    severity
  };
}
function parseLabels(value, at2, label) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TemplateInvalidError(
      label,
      at2,
      "A labelled field names its `labels`, a non-empty list."
    );
  }
  const labels = value.map((entry) => nonEmptyString(entry, at2, label, "A label"));
  if (new Set(labels).size !== labels.length) {
    throw new TemplateInvalidError(label, at2, "`labels` repeats a label.");
  }
  return labels;
}
function parseField(value, index, seen, label) {
  const at2 = `fields[${index}]`;
  if (!isMap(value)) throw new TemplateInvalidError(label, at2, "A field is a map.");
  if (value.required !== void 0) {
    throw new TemplateInvalidError(
      label,
      `${at2}.required`,
      "`required` is a list on the template, not a field property."
    );
  }
  checkKeys(value, FIELD_KEYS, at2, label);
  const name = value.name;
  if (typeof name !== "string" || !NAME.test(name)) {
    throw new TemplateInvalidError(
      label,
      `${at2}.name`,
      "A field has a `name` matching [a-z][a-z0-9-]*."
    );
  }
  if (seen.has(name)) {
    throw new TemplateInvalidError(
      label,
      `${at2}.name`,
      `The field name \`${name}\` is already declared.`
    );
  }
  seen.add(name);
  const format = FIELD_FORMATS.find((candidate) => candidate === value.format);
  if (format === void 0) {
    throw new TemplateInvalidError(
      label,
      `${at2}.format`,
      `A field has a \`format\`: ${FIELD_FORMATS.join(", ")}.`
    );
  }
  const heading = value.heading === void 0 ? name : nonEmptyString(value.heading, `${at2}.heading`, label, "`heading`");
  if (value.guidance !== void 0 && typeof value.guidance !== "string") {
    throw new TemplateInvalidError(label, `${at2}.guidance`, "`guidance` is a string.");
  }
  let labels = null;
  if (format === "labelled") {
    labels = parseLabels(value.labels, `${at2}.labels`, label);
  } else if (value.labels !== void 0) {
    throw new TemplateInvalidError(
      label,
      `${at2}.labels`,
      "`labels` belongs to a labelled field alone."
    );
  }
  return {
    name,
    format,
    required: false,
    heading,
    guidance: value.guidance === void 0 ? "" : value.guidance.trim(),
    length: value.length === void 0 ? null : parseLength(value.length, format, `${at2}.length`, label),
    labels
  };
}
function parseWorkType(value, kind, label) {
  if (value === void 0) return null;
  if (kind !== "work-item") {
    throw new TemplateInvalidError(
      label,
      "work-type",
      "`work-type` belongs to a work-item template alone."
    );
  }
  return nonEmptyString(value, "work-type", label, "`work-type`, a Jira work type name,").trim();
}
function parseRequired(value, fields, label) {
  if (value === void 0) return /* @__PURE__ */ new Set();
  if (!Array.isArray(value)) {
    throw new TemplateInvalidError(label, "required", "`required` is a list of field names.");
  }
  const names = /* @__PURE__ */ new Set();
  value.forEach((entry, index) => {
    const at2 = `required[${index}]`;
    if (typeof entry !== "string") {
      throw new TemplateInvalidError(label, at2, "A `required` entry is a field name.");
    }
    if (!fields.some((field) => field.name === entry)) {
      throw new TemplateInvalidError(label, at2, `The field \`${entry}\` is not declared.`);
    }
    if (names.has(entry)) {
      throw new TemplateInvalidError(label, at2, `The field \`${entry}\` is already listed.`);
    }
    names.add(entry);
  });
  return names;
}
function checkPlaceholders(body, kind, fields, label) {
  const facts = FACTS[kind];
  for (const token of body.match(PLACEHOLDER2) ?? []) {
    const key = PLACEHOLDER_NAME.exec(token)?.[1];
    const known = key !== void 0 && (key.startsWith(FIELD_PREFIX2) ? fields.some((field) => field.name === key.slice(FIELD_PREFIX2.length)) : facts.includes(key));
    if (kind === "work-item") {
      throw new TemplateInvalidError(
        label,
        "body",
        `A work item body takes no placeholder; found ${token}.`
      );
    }
    if (!known) {
      throw new TemplateInvalidError(
        label,
        "body",
        `${token} is neither {{field.<declared name>}} nor one of ${facts.map((fact) => `{{${fact}}}`).join(", ")}.`
      );
    }
  }
}
function stem(label) {
  return basename(label).replace(/\.yaml$/, "");
}
function parseTemplate(text6, label, name = stem(label)) {
  const map = documentMap(text6, label);
  if (map.schema !== 1) {
    throw new TemplateInvalidError(label, "schema", "`schema` is the number 1.");
  }
  const kind = TEMPLATE_KINDS.find((candidate) => candidate === map.kind);
  if (kind === void 0) {
    throw new TemplateInvalidError(
      label,
      "kind",
      `\`kind\` is one of ${TEMPLATE_KINDS.join(", ")}.`
    );
  }
  const description = nonEmptyString(map.description, "description", label, "`description`");
  checkKeys(map, TOP_KEYS, "", label);
  const workType = parseWorkType(map["work-type"], kind, label);
  if (!NAME.test(name)) {
    throw new TemplateInvalidError(
      label,
      "name",
      `The name "${name}" does not match [a-z][a-z0-9-]*.`
    );
  }
  if (map.fields === void 0 && kind !== "pull-request") {
    throw new TemplateInvalidError(label, "fields", `A ${kind} template declares \`fields\`.`);
  }
  const rawFields = map.fields ?? [];
  if (!Array.isArray(rawFields)) {
    throw new TemplateInvalidError(label, "fields", "`fields` is a list.");
  }
  const seen = /* @__PURE__ */ new Set();
  const declared = rawFields.map((entry, index) => parseField(entry, index, seen, label));
  const required2 = parseRequired(map.required, declared, label);
  const fields = declared.map((field) => ({ ...field, required: required2.has(field.name) }));
  if (map.body !== void 0 && typeof map.body !== "string") {
    throw new TemplateInvalidError(label, "body", "`body` is a string.");
  }
  const trimmed = (map.body ?? "").trim();
  if (kind !== "work-item" && trimmed === "") {
    throw new TemplateInvalidError(label, "body", `A ${kind} template has a body: its layout.`);
  }
  checkPlaceholders(trimmed, kind, fields, label);
  return {
    schema: 1,
    kind,
    name,
    description,
    workType,
    fields,
    body: trimmed === "" ? null : trimmed
  };
}
function readTemplateText(path8) {
  try {
    const { size } = statSync(path8);
    if (size > MAX_TEMPLATE_BYTES) {
      throw new TemplateInvalidError(
        path8,
        "file",
        `The file is ${size} bytes, over the ${MAX_TEMPLATE_BYTES}-byte limit.`
      );
    }
    return readFileSync3(path8, "utf8");
  } catch (error) {
    if (error instanceof TemplateInvalidError) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw new TemplateInvalidError(path8, "file", `The file cannot be read: ${reason}`);
  }
}
function readTemplateFile(path8) {
  return parseTemplate(readTemplateText(path8), path8);
}

// ../../plugins/jira/src/template/builtins.ts
var ASSETS = fileURLToPath2(new URL("../templates/", import.meta.url));
var cache = /* @__PURE__ */ new Map();
function builtInTemplates(kind) {
  const cached = cache.get(kind);
  if (cached !== void 0) return cached;
  const directory = join6(ASSETS, kind);
  const templates = readdirSync(directory).filter((file) => file.endsWith(".yaml")).sort().map((file) => {
    const path8 = join6(directory, file);
    const template = readTemplateFile(path8);
    if (template.kind !== kind) {
      throw new TemplateInvalidError(
        path8,
        "kind",
        `The file is in the ${kind} directory but declares kind ${template.kind}.`
      );
    }
    return template;
  });
  cache.set(kind, templates);
  return templates;
}
function builtInTemplateText(kind, name) {
  return readTemplateText(join6(ASSETS, kind, `${name}.yaml`));
}

// ../../plugins/jira/src/template/resolve.ts
var TEMPLATES_DIRECTORY = ".jira/templates";
function yamlFiles(directory) {
  try {
    return readdirSync2(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".yaml")).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}
function repoDirectory(path8, git) {
  const root = topLevel(path8, git);
  return root === null ? null : join7(root, TEMPLATES_DIRECTORY);
}
function readRepoTemplate(directory, file, kind) {
  const filePath = join7(directory, file);
  const text6 = readTemplateText(filePath);
  const declared = peekKind(text6);
  if (declared !== null && declared !== kind) return null;
  const template = parseTemplate(text6, filePath);
  return template.kind === kind ? { template, source: "repo", path: filePath } : null;
}
function repoTemplates(kind, path8, git) {
  const directory = repoDirectory(path8, git);
  if (directory === null) return [];
  const found = [];
  for (const file of yamlFiles(directory)) {
    const resolved = readRepoTemplate(directory, file, kind);
    if (resolved !== null) found.push(resolved);
  }
  return found;
}
var stem2 = (file) => file.replace(/\.yaml$/, "");
function siblingNames(directory, files, own, kind) {
  const names = [];
  for (const file of files) {
    if (file === own) continue;
    const filePath = join7(directory, file);
    const text6 = readTemplateText(filePath);
    const declared = peekKind(text6);
    if (declared === null) {
      parseTemplate(text6, filePath);
      continue;
    }
    if (declared === kind) names.push(stem2(file));
  }
  return names;
}
function resolveTemplates(kind, path8, git) {
  const repo2 = repoTemplates(kind, path8, git);
  if (repo2.length > 0) return repo2;
  return builtInTemplates(kind).map((template) => ({ template, source: "built-in", path: null }));
}
function templateText(resolved) {
  return resolved.path === null ? builtInTemplateText(resolved.template.kind, resolved.template.name) : readTemplateText(resolved.path);
}
function resolveTemplate(kind, name, path8, git) {
  const directory = repoDirectory(path8, git);
  if (directory !== null) {
    const own = `${name}.yaml`;
    const files = yamlFiles(directory);
    if (files.includes(own)) {
      const found = readRepoTemplate(directory, own, kind);
      if (found !== null) return found;
    }
    const names = siblingNames(directory, files, own, kind);
    if (names.length > 0) throw new TemplateNotFoundError(kind, name, names);
  }
  const builtIns = builtInTemplates(kind);
  const builtIn = builtIns.find((template) => template.name === name);
  if (builtIn === void 0) {
    throw new TemplateNotFoundError(
      kind,
      name,
      builtIns.map((template) => template.name)
    );
  }
  return { template: builtIn, source: "built-in", path: null };
}

// ../../plugins/jira/src/panels/template.ts
function fenceFor(text6) {
  const longest = Math.max(0, ...(text6.match(/`+/g) ?? []).map((run) => run.length));
  return "`".repeat(Math.max(3, longest + 1));
}
function block(origin, what, markdown) {
  const content = `${origin}
${what}

${markdown}`;
  const marks = fenceFor(content);
  return `${marks}
${content}
${marks}
`;
}
function templatePanels({ template, source, path: path8 }, sourceText) {
  const origin = source === "repo" ? `repo ${path8}` : `built-in ${template.name}`;
  const blocks = [];
  if (template.body !== null) blocks.push(block(origin, "body", template.body));
  for (const field of template.fields) {
    if (field.guidance !== "") blocks.push(block(origin, `field ${field.name}`, field.guidance));
  }
  if (sourceText !== void 0) blocks.push(block(origin, "source", sourceText));
  return blocks.join("\n");
}

// ../../plugins/jira/src/template/verdicts.ts
var TEMPLATE_LIST_SCHEMA = "jira-workflows/template-list/v1";
var TEMPLATE_SCHEMA = "jira-workflows/template/v1";
function templateErrorReason(error) {
  if (error instanceof TemplateInvalidError) {
    return { code: "template-invalid", detail: error.detail };
  }
  if (error instanceof TemplateNotFoundError) {
    return { code: "template-not-found", detail: error.message };
  }
  return void 0;
}
function listTemplates(kind, path8) {
  try {
    const templates = (kind === void 0 ? TEMPLATE_KINDS : [kind]).flatMap(
      (each) => resolveTemplates(each, path8).map(({ template, source, path: file }) => ({
        kind: template.kind,
        name: template.name,
        source,
        path: file,
        description: template.description
      }))
    );
    return pass(TEMPLATE_LIST_SCHEMA, { templates });
  } catch (error) {
    const reason = templateErrorReason(error);
    if (reason) return fail(TEMPLATE_LIST_SCHEMA, [reason], { templates: [] });
    throw error;
  }
}
function showTemplate(kind, name, path8, options = {}) {
  const none = {
    template: null,
    fields: [],
    body: null,
    ...options.source ? { text: null } : {}
  };
  try {
    const resolved = resolveTemplate(kind, name, path8);
    const { template } = resolved;
    const text6 = options.source ? templateText(resolved) : void 0;
    return pass(
      TEMPLATE_SCHEMA,
      {
        template: {
          kind: template.kind,
          name: template.name,
          source: resolved.source,
          path: resolved.path,
          description: template.description,
          workType: template.workType
        },
        fields: template.fields,
        body: template.body,
        ...text6 === void 0 ? {} : { text: text6 }
      },
      { panels: templatePanels(resolved, text6) }
    );
  } catch (error) {
    const reason = templateErrorReason(error);
    if (reason) return fail(TEMPLATE_SCHEMA, [reason], none);
    throw error;
  }
}

// ../../plugins/jira/src/storage/project-config.ts
function workTypeRef(workType) {
  return workType.id ?? workType.name;
}
function encodeField(field) {
  return {
    ...field.id !== void 0 ? { id: field.id } : {},
    ...field.key !== void 0 ? { key: field.key } : {},
    name: field.name,
    required: field.required,
    ...field.allowedValues !== void 0 ? { allowedValues: field.allowedValues } : {},
    ...field.acceptedInput !== void 0 ? { acceptedInput: field.acceptedInput } : {},
    ...field.example !== void 0 ? { example: field.example } : {}
  };
}
function decodeField(value) {
  if (!isJsonObject(value)) return void 0;
  const name = stringProperty(value, "name");
  if (name === void 0 || typeof value.required !== "boolean") return void 0;
  if (value.allowedValues !== void 0 && !Array.isArray(value.allowedValues)) return void 0;
  if (value.acceptedInput !== void 0 && typeof value.acceptedInput !== "string") {
    return void 0;
  }
  return {
    ...typeof value.id === "string" ? { id: value.id } : {},
    ...typeof value.key === "string" ? { key: value.key } : {},
    name,
    required: value.required,
    ...value.allowedValues !== void 0 ? { allowedValues: value.allowedValues } : {},
    ...value.acceptedInput !== void 0 ? { acceptedInput: value.acceptedInput } : {},
    ...value.example !== void 0 ? { example: value.example } : {}
  };
}
function decodeWorkType(value) {
  if (!isJsonObject(value)) return void 0;
  const name = stringProperty(value, "name");
  if (name === void 0) return void 0;
  if (value.id !== void 0 && typeof value.id !== "string") return void 0;
  return { ...value.id !== void 0 ? { id: value.id } : {}, name };
}
function decodeProject(value) {
  if (!isJsonObject(value)) return void 0;
  const id = stringProperty(value, "id");
  const key = stringProperty(value, "key");
  const name = stringProperty(value, "name");
  if (id === void 0 || key === void 0 || name === void 0) return void 0;
  if (value.projectTypeKey !== void 0 && typeof value.projectTypeKey !== "string") {
    return void 0;
  }
  try {
    return {
      id: asProjectId(id),
      key: asProjectKey(key),
      name,
      ...value.projectTypeKey !== void 0 ? { projectTypeKey: value.projectTypeKey } : {}
    };
  } catch {
    return void 0;
  }
}
var jiraProjectConfigCodec = {
  version: 1,
  encode: (value) => ({
    cloudId: value.cloudId,
    project: {
      id: value.project.id,
      key: value.project.key,
      name: value.project.name,
      ...value.project.projectTypeKey !== void 0 ? { projectTypeKey: value.project.projectTypeKey } : {}
    },
    workTypes: value.workTypes.map((type) => ({
      ...type.id !== void 0 ? { id: type.id } : {},
      name: type.name
    })),
    fieldsByWorkType: Object.fromEntries(
      Object.entries(value.fieldsByWorkType).map(([ref, fields]) => [ref, fields.map(encodeField)])
    )
  }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const cloudId = stringProperty(value, "cloudId");
    if (cloudId === void 0 || value.project === void 0 || !Array.isArray(value.workTypes) || value.fieldsByWorkType === void 0 || !isJsonObject(value.fieldsByWorkType)) {
      return void 0;
    }
    const project = decodeProject(value.project);
    const workTypes = decodeArray(value.workTypes, decodeWorkType);
    if (project === void 0 || workTypes === void 0) return void 0;
    const fieldsByWorkType = {};
    for (const [ref, fields] of Object.entries(value.fieldsByWorkType)) {
      if (!Array.isArray(fields) || !isJsonValue(fields)) return void 0;
      const decoded = decodeArray(fields, decodeField);
      if (decoded === void 0) return void 0;
      fieldsByWorkType[ref] = decoded;
    }
    return { cloudId: asCloudId(cloudId), project, workTypes, fieldsByWorkType };
  }
};
var jiraProjectConfigKeys = {
  config(cloudId, projectId) {
    return defineStorageKey(
      `${CONTENT.projectConfiguration.keyPrefix}${encodeURIComponent(cloudId)}/${encodeURIComponent(projectId)}`,
      jiraProjectConfigCodec
    );
  }
};
function createJiraProjectConfigStore(store) {
  return {
    getProjectConfig: (cloudId, projectId) => store.get(jiraProjectConfigKeys.config(cloudId, projectId)),
    setProjectConfig: (value) => store.set(jiraProjectConfigKeys.config(value.cloudId, value.project.id), value),
    deleteProjectConfig: (cloudId, projectId) => store.delete(jiraProjectConfigKeys.config(cloudId, projectId))
  };
}

// ../../plugins/jira/src/work-item/preflight.ts
var PREFLIGHT_VERDICT_SCHEMA = "jira-workflows/preflight-verdict/v1";
var MAX_LIST = 20;
var PreflightUsageError = class extends Error {
};
function fieldsPayloadOf(fields) {
  const payload = {};
  for (const field of fields) {
    const separator = field.indexOf("=");
    if (separator === -1) {
      throw new UsageError(`--field needs a <key>=<value>: ${field}`);
    }
    payload[field.slice(0, separator)] = field.slice(separator + 1);
  }
  return payload;
}
function toVerdict(reasons, findings) {
  return reasons.reduce(
    (verdict, { code, detail, severity }) => withReason(verdict, { code, detail }, severity),
    pass(PREFLIGHT_VERDICT_SCHEMA, findings)
  );
}
function normalize2(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
var ISSUE_KEY_IN_URL = /\/browse\/([A-Za-z][A-Za-z0-9_]*)-\d+/;
var PROJECT_IN_URL = /\/projects\/([A-Za-z][A-Za-z0-9_]*)/;
var PROJECT_IN_QUERY = /[?&]selectedProjectKey=([A-Za-z][A-Za-z0-9_]*)/;
function classifyDestination(input) {
  const value = String(input ?? "").trim();
  if (!value) {
    throw new PreflightUsageError("--destination is required");
  }
  if (/^https?:\/\//i.test(value)) {
    for (const pattern of [ISSUE_KEY_IN_URL, PROJECT_IN_URL, PROJECT_IN_QUERY]) {
      const match = pattern.exec(value);
      if (match) {
        return { input: value, arg: match[1].toUpperCase() };
      }
    }
    return { input: value, arg: void 0 };
  }
  return { input: value, arg: value };
}
function unwrapData(payload) {
  return payload !== void 0 && isJsonObject(payload) && "data" in payload ? payload.data : payload;
}
function readProjects(payload) {
  const data = unwrapData(payload);
  if (data === void 0) return [];
  const items = Array.isArray(data) ? data : [data];
  const projects = [];
  for (const item of items) {
    if (isJsonObject(item) && typeof item.key === "string") {
      projects.push({
        id: typeof item.id === "string" ? item.id : void 0,
        key: item.key,
        name: typeof item.name === "string" ? item.name : void 0,
        projectTypeKey: typeof item.projectTypeKey === "string" ? item.projectTypeKey : void 0
      });
    }
  }
  return projects;
}
function readWorkTypes(payload) {
  const items = extractArrayPayload(payload, ["issueTypes", "types"]) ?? [];
  const types = [];
  for (const item of items) {
    if (isJsonObject(item) && typeof item.name === "string" && item.subtask !== true) {
      types.push({
        ...typeof item.id === "string" ? { id: item.id } : {},
        name: item.name
      });
    }
  }
  return types;
}
function readFields(payload) {
  const items = extractArrayPayload(payload, ["fields"]) ?? [];
  const fields = [];
  for (const item of items) {
    if (isJsonObject(item) && typeof item.name === "string") {
      fields.push({
        ...typeof item.id === "string" ? { id: item.id } : {},
        ...typeof item.key === "string" ? { key: item.key } : {},
        name: item.name,
        required: item.required === true,
        ...Array.isArray(item.allowedValues) ? { allowedValues: item.allowedValues } : {},
        ...typeof item.acceptedInput === "string" ? { acceptedInput: item.acceptedInput } : {},
        ...item.example !== void 0 ? { example: item.example } : {}
      });
    }
  }
  return fields;
}
function resolveWorkType(request, types) {
  if (request === void 0) return void 0;
  const matches = types.filter(
    (type) => normalize2(type.name) === normalize2(request.ref) || type.id === request.ref
  );
  return matches.length === 1 ? matches[0] : void 0;
}
function unresolvedWorkTypeReason(request, projectKey) {
  if (request === void 0) {
    return {
      code: "work-type-needed",
      severity: "warn",
      detail: `No work type was named. Choose one of ${projectKey}'s available types from workType.candidates and re-run with --type.`
    };
  }
  const declaredBy = request.template === void 0 ? "" : `, declared by the ${request.template} template,`;
  return {
    code: "work-type-unresolved",
    severity: "warn",
    detail: `No work type matched "${request.ref}"${declaredBy} among ${projectKey}'s available types.`
  };
}
function isEmptyValue2(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
function isFieldSupplied(field, payload) {
  const aliases = new Set(
    [field.id, field.key, field.name].filter((v) => Boolean(v)).map(normalize2)
  );
  for (const [key, value] of Object.entries(payload)) {
    if (aliases.has(normalize2(key)) && !isEmptyValue2(value)) return true;
  }
  return false;
}
function summarizeAllowedValues(field) {
  const values = field.allowedValues ?? [];
  const labels = values.map((option) => isJsonObject(option) ? option.value ?? option.name ?? option.id : option).filter((label) => label !== void 0 && label !== null).map(String);
  return {
    valueCount: labels.length,
    values: labels.slice(0, MAX_LIST),
    truncated: labels.length > MAX_LIST
  };
}
function summarizeFields(fields, payload) {
  const requiredMissing = [];
  const allowedValue = [];
  for (const field of fields) {
    const summary = {
      id: field.id,
      name: field.name,
      acceptedInput: field.acceptedInput,
      example: field.example
    };
    if (field.required && !isFieldSupplied(field, payload)) {
      requiredMissing.push(summary);
    }
    if (field.allowedValues && field.allowedValues.length > 0) {
      allowedValue.push({ ...summary, ...summarizeAllowedValues(field) });
    }
  }
  return { requiredMissing, allowedValue };
}
function readPath2(value, path8) {
  let current = value;
  for (const segment of path8) {
    if (current === void 0 || !isJsonObject(current)) return void 0;
    current = current[segment];
  }
  return current;
}
function isJiraProduct2(productId) {
  return typeof productId === "string" && productId.startsWith("jira");
}
function listAccessibleSites(binary, runner) {
  const result = runner(binary, ["access"]);
  if (!result.ok) return [];
  const products = readPath2(result.payload, ["data", "products"]);
  if (!Array.isArray(products)) return [];
  const byCloudId = /* @__PURE__ */ new Map();
  for (const product of products) {
    if (!isJsonObject(product) || !isJiraProduct2(product.productId)) continue;
    const productSites = product.sites;
    if (!Array.isArray(productSites)) continue;
    for (const site of productSites) {
      if (!isJsonObject(site)) continue;
      const { name, url, cloudId } = site;
      if (typeof name === "string" && typeof url === "string" && typeof cloudId === "string") {
        byCloudId.set(cloudId, { name, url, cloudId });
      }
    }
  }
  return [...byCloudId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
var CLOUD_ID_IN_SELF = /\/ex\/jira\/([0-9a-f-]+)\//i;
function readCloudId(value, depth = 3) {
  if (value === void 0 || depth < 0) return void 0;
  if (typeof value === "string") return CLOUD_ID_IN_SELF.exec(value)?.[1];
  if (Array.isArray(value) || isJsonObject(value)) {
    for (const child of Object.values(value)) {
      const found = readCloudId(child, depth - 1);
      if (found !== void 0) return found;
    }
  }
  return void 0;
}
function readRequestSite(payload) {
  const site = readPath2(payload, ["request", "site"]);
  return typeof site === "string" && site.length > 0 ? site : void 0;
}
function projectContextOf(project, payload) {
  const cloudId = readCloudId(unwrapData(payload));
  const site = readRequestSite(payload);
  if (cloudId === void 0 || site === void 0) return void 0;
  try {
    const siteUrl = siteOrigin(site);
    return {
      cloudId: asCloudId(cloudId),
      projectId: asProjectId(project.id),
      projectKey: asProjectKey(project.key),
      projectName: project.name ?? project.key,
      tenantName: hostLabel(siteUrl),
      siteUrl,
      lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return void 0;
  }
}
var EMPTY_DESTINATION = { projectKey: void 0, candidates: [] };
var EMPTY_WORK_TYPE = { name: void 0, candidates: [] };
var UNCHECKED_FIELDS = {
  checked: false,
  scope: "not-checked",
  requiredMissing: [],
  allowedValue: []
};
function fromStoredConfig(config, request, fieldsPayload) {
  if (config.project.projectTypeKey === "service_desk") return void 0;
  const workType = resolveWorkType(request, config.workTypes);
  if (workType === void 0) return void 0;
  const fields = config.fieldsByWorkType[workTypeRef(workType)];
  if (fields === void 0) return void 0;
  const { requiredMissing, allowedValue } = summarizeFields(fields, fieldsPayload);
  if (requiredMissing.length > 0) return void 0;
  const findings = {
    destination: { projectKey: config.project.key, candidates: [] },
    workType: { name: workType.name, candidates: [] },
    fields: { checked: true, scope: "customfield-only", requiredMissing, allowedValue }
  };
  return pass(PREFLIGHT_VERDICT_SCHEMA, findings);
}
async function preflightLive(input) {
  const { options, request, destination, site, indexed, fieldsPayload, binary, runner } = input;
  const reasons = [];
  const spaceResult = runner(binary, ["jira", "space", "get", destination.arg], { site });
  const projects = spaceResult.ok ? readProjects(spaceResult.payload) : [];
  if (projects.length === 0) {
    const sites = listAccessibleSites(binary, runner);
    reasons.push({
      code: "project-unresolved",
      severity: "fail",
      detail: `No project matched "${destination.input}" on ${site ? `site ${site}` : "the default site"}. The verdict's \`sites\` carries the caller's other reachable Jira sites; ask the user which to try.`
    });
    return {
      verdict: toVerdict(reasons, {
        destination: EMPTY_DESTINATION,
        workType: EMPTY_WORK_TYPE,
        fields: UNCHECKED_FIELDS,
        sites
      })
    };
  }
  if (projects.length > 1) {
    const candidates = projects.slice(0, MAX_LIST).map((project2) => ({ key: project2.key, name: project2.name }));
    reasons.push({
      code: "project-ambiguous",
      severity: "warn",
      detail: `"${destination.input}" matched ${projects.length} project(s); ask the user to choose one, then re-run this preflight against their choice.`
    });
    return {
      verdict: toVerdict(reasons, {
        destination: { projectKey: void 0, candidates },
        workType: EMPTY_WORK_TYPE,
        fields: UNCHECKED_FIELDS
      })
    };
  }
  const project = projects[0];
  const destinationOut = { projectKey: project.key, candidates: [] };
  let cloudId = indexed?.cloudId;
  if (cloudId === void 0 && options.memory !== void 0 && project.id !== void 0) {
    const context = projectContextOf({ ...project, id: project.id }, spaceResult.payload);
    if (context !== void 0) {
      await options.memory.setProjectContext(context);
      cloudId = context.cloudId;
    }
  }
  if (project.projectTypeKey === "service_desk") {
    reasons.push({
      code: "jsm-destination",
      severity: "fail",
      detail: `${project.key} is a JSM project. A request there carries a request type, which is not a workitem operation; route to the JSM surface or confirm a different destination.`
    });
    return {
      verdict: toVerdict(reasons, {
        destination: destinationOut,
        workType: EMPTY_WORK_TYPE,
        fields: UNCHECKED_FIELDS
      })
    };
  }
  const typesResult = runner(
    binary,
    ["jira", "workitem", "types", "query", "--project", project.key],
    { site }
  );
  const types = typesResult.ok ? readWorkTypes(typesResult.payload) : [];
  const workType = resolveWorkType(request, types);
  const storable = cloudId !== void 0 && project.id !== void 0 && typesResult.ok ? { cloudId, project: { ...project, id: project.id }, workTypes: types } : void 0;
  if (!workType) {
    reasons.push(unresolvedWorkTypeReason(request, project.key));
    return {
      verdict: toVerdict(reasons, {
        destination: destinationOut,
        workType: {
          name: void 0,
          candidates: types.slice(0, MAX_LIST).map((type) => ({ id: type.id, name: type.name }))
        },
        fields: UNCHECKED_FIELDS
      }),
      config: storable
    };
  }
  const workTypeOut = { name: workType.name, candidates: [] };
  const metadataResult = runner(
    binary,
    [
      "jira",
      "workitem",
      "field",
      "create-metadata",
      "--space",
      project.key,
      "--type",
      workTypeRef(workType)
    ],
    { site }
  );
  if (!metadataResult.ok) {
    reasons.push({
      code: "field-metadata-unavailable",
      severity: "warn",
      detail: metadataResult.detail ?? "twg exited non-zero reading field metadata."
    });
    return {
      verdict: toVerdict(reasons, {
        destination: destinationOut,
        workType: workTypeOut,
        fields: UNCHECKED_FIELDS
      }),
      config: storable
    };
  }
  const fields = readFields(metadataResult.payload);
  const { requiredMissing, allowedValue } = summarizeFields(fields, fieldsPayload);
  if (requiredMissing.length > 0) {
    reasons.push({
      code: "required-fields-missing",
      severity: "warn",
      detail: `${requiredMissing.length} required field(s) have no value: ${requiredMissing.map((field) => field.name).join(", ")}.`
    });
  }
  return {
    verdict: toVerdict(reasons, {
      destination: destinationOut,
      workType: workTypeOut,
      // `create-metadata` returns `customfield_*` entries only, so a required
      // system field configured on the project is outside what this can see.
      fields: { checked: true, scope: "customfield-only", requiredMissing, allowedValue }
    }),
    config: storable && { ...storable, fields: { ref: workTypeRef(workType), fields } }
  };
}
async function storeLiveConfig(store, learned, replace) {
  let projectId;
  let projectKey;
  try {
    projectId = asProjectId(learned.project.id);
    projectKey = asProjectKey(learned.project.key);
  } catch {
    return;
  }
  const previous = replace ? void 0 : await store.getProjectConfig(learned.cloudId, projectId);
  await store.setProjectConfig({
    cloudId: learned.cloudId,
    project: {
      id: projectId,
      key: projectKey,
      name: learned.project.name ?? learned.project.key,
      ...learned.project.projectTypeKey !== void 0 ? { projectTypeKey: learned.project.projectTypeKey } : {}
    },
    workTypes: learned.workTypes,
    fieldsByWorkType: {
      ...previous?.fieldsByWorkType ?? {},
      ...learned.fields !== void 0 ? { [learned.fields.ref]: learned.fields.fields } : {}
    }
  });
}
function workTypeRequest(options) {
  if (options.type !== void 0 && options.type.trim() !== "") {
    return { request: { ref: options.type.trim(), template: void 0 } };
  }
  if (options.template === void 0) return { request: void 0 };
  try {
    const { template } = resolveTemplate(
      "work-item",
      options.template,
      options.path ?? process.cwd()
    );
    return {
      request: template.workType === null ? void 0 : { ref: template.workType, template: template.name }
    };
  } catch (error) {
    const reason = templateErrorReason(error);
    if (reason === void 0) throw error;
    return { reason: { ...reason, severity: "fail" } };
  }
}
var NOTHING_RESOLVED = {
  destination: EMPTY_DESTINATION,
  workType: EMPTY_WORK_TYPE,
  fields: UNCHECKED_FIELDS
};
async function preflightDestination(options) {
  const runner = options.runner ?? runTwgJson;
  const env = options.env ?? process.env;
  const binary = resolveTwgBinary(env);
  const fieldsPayload = options.fieldsPayload ?? {};
  const destination = classifyDestination(options.destination);
  if (destination.arg === void 0) {
    return toVerdict(
      [
        {
          code: "destination-unparsed",
          severity: "fail",
          detail: `No project key could be read from the URL "${destination.input}". Supply a project key instead.`
        }
      ],
      NOTHING_RESOLVED
    );
  }
  const requested = workTypeRequest(options);
  if ("reason" in requested) return toVerdict([requested.reason], NOTHING_RESOLVED);
  const { request } = requested;
  const indexed = options.memory !== void 0 ? await resolveIndexedProject(options.memory, destination.arg, options.site) : void 0;
  const site = options.site ?? indexed?.tenantName;
  const configStore = options.memory !== void 0 ? createJiraProjectConfigStore(options.memory.plugin) : void 0;
  if (indexed !== void 0 && configStore !== void 0 && options.refresh !== true) {
    const stored = await configStore.getProjectConfig(indexed.cloudId, indexed.projectId);
    const verdict = stored === void 0 ? void 0 : fromStoredConfig(stored, request, fieldsPayload);
    if (verdict !== void 0) {
      noteAssetRetrieval({
        assetType: CONTENT.projectConfiguration.assetType,
        assetCount: 1,
        retrievalSource: "local",
        retrievedAssets: [
          { objectType: CONTENT.projectConfiguration.assetType, objectId: indexed.projectId }
        ]
      });
      return verdict;
    }
  }
  const outcome = await preflightLive({
    options,
    request,
    destination: { input: destination.input, arg: destination.arg },
    site,
    indexed,
    fieldsPayload,
    binary,
    runner
  });
  if (configStore !== void 0 && outcome.config !== void 0) {
    await storeLiveConfig(configStore, outcome.config, options.refresh === true);
  }
  return outcome.verdict;
}

// ../../plugins/jira/src/work-item/create.ts
var CREATE_WORK_ITEM_SCHEMA = "jira-workflows/create-work-item/v1";
var DESCRIPTION_FORMATS = ["html", "markdown", "plain"];
var DESCRIPTION_PLACEHOLDER = "<description>";
function checkArguments2(options) {
  if (options.space.trim().length === 0) throw new UsageError("--space is blank");
  if (options.type.trim().length === 0) throw new UsageError("--type is blank");
  if (options.summary.trim().length === 0) throw new UsageError("--summary is blank");
  if (options.descriptionFormat !== void 0 && !DESCRIPTION_FORMATS.includes(options.descriptionFormat)) {
    throw new UsageError(
      `--description-format must be one of ${DESCRIPTION_FORMATS.join(", ")}: ${options.descriptionFormat}`
    );
  }
  for (const field of options.fields ?? []) {
    if (!field.includes("=")) {
      throw new UsageError(`--field needs a <key>=<value>: ${field}`);
    }
  }
}
function buildCommand(options) {
  const args = [
    "jira",
    "workitem",
    "create",
    "--space",
    options.space,
    "--type",
    options.type,
    "--summary",
    options.summary
  ];
  if (options.description !== void 0) {
    args.push("--description", options.description);
    if (options.descriptionFormat !== void 0) {
      args.push("--description-format", options.descriptionFormat);
    }
  }
  if (options.parent !== void 0) args.push("--parent", options.parent);
  for (const field of options.fields ?? []) args.push("--field", field);
  const displayed = options.site !== void 0 ? [...args, "--site", options.site] : args;
  const shown = displayed.map((arg, index) => displayed[index - 1] === "--description" ? DESCRIPTION_PLACEHOLDER : arg).map((arg) => /[\s"]/.test(arg) ? JSON.stringify(arg) : arg).join(" ");
  return { args, display: `twg ${shown}` };
}
function extractCreatedKey(payload) {
  if (payload === void 0 || !isJsonObject(payload)) return void 0;
  const candidates = [
    isJsonObject(payload.data) && isJsonObject(payload.data.issue) ? payload.data.issue.key : void 0,
    isJsonObject(payload.data) ? payload.data.key : void 0,
    payload.key
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    try {
      return asIssueKey(candidate);
    } catch {
    }
  }
  return void 0;
}
function emptyExtra(options, command) {
  return {
    key: null,
    url: null,
    site: options.site ?? null,
    command: command.display,
    linked: false,
    item: null,
    fields: null
  };
}
async function refreshFieldsAfterFailedCreate(options, indexed, runner, env) {
  if (indexed !== void 0) {
    await createJiraProjectConfigStore(options.memory.plugin).deleteProjectConfig(
      indexed.cloudId,
      indexed.projectId
    );
  }
  const verdict = await preflightDestination({
    destination: options.space,
    type: options.type,
    site: options.site ?? indexed?.tenantName,
    fieldsPayload: fieldsPayloadOf(options.fields ?? []),
    refresh: true,
    memory: options.memory,
    runner,
    env
  });
  return verdict.fields;
}
async function createWorkItem(options) {
  checkArguments2(options);
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const indexed = await resolveIndexedProject(options.memory, options.space, options.site);
  const site = options.site ?? indexed?.tenantName;
  const resolved = { ...options, site };
  const command = buildCommand(resolved);
  const common = emptyExtra(resolved, command);
  let binary;
  try {
    binary = resolveTwgBinary(env);
  } catch (error) {
    if (error instanceof TwgNotFoundError) {
      return fail(
        CREATE_WORK_ITEM_SCHEMA,
        [
          {
            code: "twg-not-found",
            detail: twgNotFoundDetail(error.message, "created")
          }
        ],
        common
      );
    }
    throw error;
  }
  const written = runner(binary, command.args, site !== void 0 ? { site } : {});
  if (!written.ok && written.malformed !== true) {
    const fields = await refreshFieldsAfterFailedCreate(options, indexed, runner, env);
    return fail(
      CREATE_WORK_ITEM_SCHEMA,
      [
        {
          code: "create-failed",
          detail: `${written.detail ?? "twg exited non-zero"}. Nothing was created.`
        }
      ],
      { ...common, fields }
    );
  }
  const key = written.ok ? extractCreatedKey(written.payload) : void 0;
  if (key === void 0) {
    const detail = written.ok ? "twg reported the create as successful but returned no issue key; the item may exist in Jira, and the session was not linked to it." : `twg exited zero but its output could not be read (${written.detail ?? "not JSON"}); the item may exist in Jira, and the session was not linked to it.`;
    return warn(CREATE_WORK_ITEM_SCHEMA, [{ code: "key-unresolved", detail }], common);
  }
  const withKey = {
    ...common,
    key,
    url: site !== void 0 ? browseUrl(site, key) : null
  };
  try {
    const stored = await fetchWorkItem({
      key,
      site,
      scope: "session",
      linkSource: "workItemCreate",
      memory: options.memory,
      runner,
      env
    });
    const storedSite = typeof stored.site === "string" ? stored.site : void 0;
    const url = storedSite !== void 0 ? browseUrl(storedSite, key) : withKey.url;
    return pass(CREATE_WORK_ITEM_SCHEMA, {
      ...withKey,
      site: site ?? storedSite ?? null,
      url,
      linked: true,
      item: {
        key: stored.key,
        summary: stored.summary ?? null,
        url,
        type: stored.issuetype?.name ?? null,
        status: stored.status?.name ?? null
      }
    });
  } catch (error) {
    const cause = error instanceof FetchWorkItemError ? ` (${error.code}): ${error.message}` : `: ${error instanceof Error ? error.message : String(error)}`;
    const reason = {
      code: "link-failed",
      detail: `${key} was created, but reading it back into the session failed${cause}`
    };
    return warn(CREATE_WORK_ITEM_SCHEMA, [reason], withKey);
  }
}

// ../../plugins/jira/src/work-item/read.ts
async function readWorkItem(options) {
  const { site, scope, refresh, memory, runner, env } = options;
  const issueKey = asIssueKey(options.key);
  const projectKey = projectKeyOfIssueKey(issueKey);
  const indexed = await memory.getCloudSites(projectKey);
  const picked = pickIndexedSite(indexed, site);
  if (picked !== void 0) {
    const record2 = refresh ? void 0 : await memory.getWorkItem(scope, picked.cloudId, issueKey);
    if (record2 !== void 0) {
      noteAssetRetrieval({
        assetType: CONTENT.workItem.assetType,
        assetCount: 1,
        retrievalSource: "local",
        siteSource: assetSiteSource(site, picked.tenantName)
      });
      return { record: record2, fetched: false };
    }
  } else if (site === void 0 && indexed.length > 1) {
    throw new FetchWorkItemError(
      "cloud-id-unresolved",
      `Multiple Jira sites are indexed for project "${projectKey}"; pass --site to pick one. ${listCandidates3(indexed)} Nothing was stored.`,
      indexed.map(toJiraSite)
    );
  }
  const record = await fetchWorkItem({
    key: issueKey,
    site: site ?? picked?.tenantName,
    scope,
    memory,
    runner,
    env
  });
  return { record, fetched: true };
}
function toJiraSite(site) {
  return { name: site.tenantName, url: site.siteUrl, cloudId: site.cloudId };
}
function listCandidates3(sites) {
  const lines = sites.map((site) => `  - ${site.tenantName} (${site.siteUrl})`).join("\n");
  return `Candidate sites:
${lines}`;
}

// ../../plugins/jira/src/work-item/comment.ts
var COMMENT_WORK_ITEM_SCHEMA = "jira-workflows/comment-work-item/v1";
var BODY_FORMATS = DESCRIPTION_FORMATS;
function checkArguments3(options) {
  if (options.body.trim().length === 0) throw new UsageError("--body is blank");
  if (options.bodyFormat !== void 0 && !BODY_FORMATS.includes(options.bodyFormat)) {
    throw new UsageError(
      `--body-format must be one of ${BODY_FORMATS.join(", ")}: ${options.bodyFormat}`
    );
  }
}
function createdCommentOf(payload) {
  if (payload === void 0 || !isJsonObject(payload)) return void 0;
  const comment = isJsonObject(payload.data) ? payload.data : payload;
  return typeof comment.id === "string" || typeof comment.id === "number" ? comment : void 0;
}
async function commentOnWorkItem(options) {
  checkArguments3(options);
  const { key, memory } = options;
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const projectKey = projectKeyOfIssueKey(key);
  const indexed = await memory.getCloudSites(projectKey);
  const picked = pickIndexedSite(indexed, options.site);
  const site = options.site ?? picked?.tenantName;
  const common = { key, site: site ?? null, linked: false, comment: null };
  if (picked === void 0 && options.site === void 0 && indexed.length > 1) {
    return fail(
      COMMENT_WORK_ITEM_SCHEMA,
      [
        {
          code: "site-unresolved",
          detail: `Multiple Jira sites are indexed for project "${projectKey}"; pass --site to pick one. Nothing was posted.`
        }
      ],
      { ...common, sites: indexed.map(toJiraSite) }
    );
  }
  try {
    return await postAndLink(options, resolveTwgBinary(env), runner, picked, site, common);
  } catch (error) {
    if (!(error instanceof TwgNotFoundError)) throw error;
    return fail(
      COMMENT_WORK_ITEM_SCHEMA,
      [{ code: "twg-not-found", detail: twgNotFoundDetail(error.message, "posted") }],
      common
    );
  }
}
async function postAndLink(options, binary, runner, picked, site, common) {
  const { key, memory } = options;
  const projectKey = projectKeyOfIssueKey(key);
  let cloudId = picked?.cloudId;
  let liveSites;
  if (picked === void 0) {
    try {
      const live = resolveLiveSite(binary, runner, options.site, "posted");
      cloudId = live.matched !== void 0 ? asCloudId(live.matched.cloudId) : void 0;
      liveSites = live.sites;
    } catch (error) {
      if (!(error instanceof FetchWorkItemError)) throw error;
      if (error.code === "not-authenticated") return notAuthenticated2(error.message, common);
    }
  }
  const args = ["jira", "workitem", "comment", "create", "--issue-id", key, "--body", options.body];
  if (options.bodyFormat !== void 0) args.push("--body-format", options.bodyFormat);
  const posted = runner(binary, args, site !== void 0 ? { site } : {});
  if (!posted.ok && posted.malformed !== true) {
    const detail = posted.detail ?? "twg exited non-zero";
    if (isAuthFailure(detail))
      return notAuthenticated2(notAuthenticatedDetail(detail, "posted"), common);
    if (liveSites !== void 0 && options.site === void 0 && isMissingOrForbidden(detail) && projectPresenceOnSite(binary, runner, projectKey, void 0) === "absent") {
      return fail(
        COMMENT_WORK_ITEM_SCHEMA,
        [
          {
            code: "site-unresolved",
            detail: `${key} was not found on twg's default site: ${detail}. Ask the user which site to use; do not try another site unprompted. Nothing was posted.`
          }
        ],
        { ...common, sites: liveSites }
      );
    }
    return fail(
      COMMENT_WORK_ITEM_SCHEMA,
      [{ code: "comment-failed", detail: `${detail}. Nothing was posted.` }],
      common
    );
  }
  const comment = posted.ok ? createdCommentOf(posted.payload) : void 0;
  if (comment === void 0) {
    const detail = posted.ok ? "twg reported the comment as posted but returned no comment id; the comment may exist, and the session was not linked to the item." : `twg exited zero but its output could not be read (${posted.detail ?? "not JSON"}); the comment may exist, and the session was not linked to the item.`;
    return warn(COMMENT_WORK_ITEM_SCHEMA, [{ code: "comment-unconfirmed", detail }], common);
  }
  const withComment = { ...common, comment };
  if (cloudId === void 0) {
    return warn(
      COMMENT_WORK_ITEM_SCHEMA,
      [
        {
          code: "link-unresolved",
          detail: `The comment was posted, but the cloud id of ${site ?? "twg's default site"} could not be resolved, so the session was not linked to ${key}.`
        }
      ],
      withComment
    );
  }
  try {
    await recordCommentLink(memory, cloudId, key, picked?.projectId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return warn(
      COMMENT_WORK_ITEM_SCHEMA,
      [
        {
          code: "link-failed",
          detail: `The comment was posted, but recording the session link failed: ${message}`
        }
      ],
      withComment
    );
  }
  return pass(COMMENT_WORK_ITEM_SCHEMA, { ...withComment, linked: true });
}
function notAuthenticated2(detail, extra) {
  return fail(COMMENT_WORK_ITEM_SCHEMA, [{ code: "not-authenticated", detail }], extra);
}
async function recordCommentLink(memory, cloudId, issueKey, projectId) {
  const links = createJiraLinkSignalStore(memory.session);
  if (await links.has(cloudId, issueKey)) return;
  await links.recordPending({
    cloudId,
    issueKey,
    ...projectId !== void 0 ? { projectId } : {},
    linkSource: "comment"
  });
}

// ../../plugins/jira/src/storage/github-pull-requests.ts
function isPreference(value) {
  return value === "skip" || value === "ask";
}
var preferenceCodec = {
  version: 1,
  encode: (value) => ({ preference: value.preference }),
  decode: (value) => {
    if (!isJsonObject(value) || !isPreference(value.preference)) return void 0;
    return { preference: value.preference };
  }
};
var preferenceKey = defineStorageKey(
  "jira/github-pull-requests-preference",
  preferenceCodec
);
function getGithubPullRequestsPreference(store) {
  return store.get(preferenceKey);
}
function setGithubPullRequestsPreference(store, value) {
  return store.set(preferenceKey, value);
}

// ../../plugins/jira/src/changes/publish.ts
var REVIEW_LIKE = /review/i;
var CATEGORY_DONE = "done";
var MIN_TRANSITION_TIMEOUT_MS = 18e4;
var lower = (value) => String(value ?? "").trim().toLowerCase();
var firstLine4 = (text6) => text6.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
var gitFailure2 = (result, fallback) => firstLine4(result.stderr) || firstLine4(result.stdout) || fallback;
function locateTree2(path8, git) {
  const root = topLevel(path8, git);
  if (root === null) {
    return {
      error: { code: "not-a-git-tree", detail: `${path8} is not inside a git working tree` }
    };
  }
  const branch = currentBranch(root, git);
  if (branch === null) {
    return {
      error: {
        code: "detached-head",
        detail: `${root} is on a detached HEAD; check out the work branch first`
      }
    };
  }
  const origin = remoteUrl(root, "origin", git);
  if (origin === null) {
    return { error: { code: "no-origin", detail: `${root} has no origin remote` } };
  }
  const remote = parseRemote(origin);
  if (remote === void 0) {
    return {
      error: {
        code: "origin-unparsed",
        detail: `Could not read a workspace and repository from ${origin}`
      }
    };
  }
  return { located: { root, branch, remote } };
}
function readTree2(located, options) {
  const { git, dest } = options;
  const { root, branch, remote } = located;
  const named = dest ?? defaultBranch(root, git);
  if (named === null) {
    return {
      error: {
        code: "default-branch-unknown",
        detail: "origin/HEAD names no branch and neither origin/main nor origin/master exists; pass --dest"
      }
    };
  }
  const baseRef = `origin/${named}`;
  let stale;
  if (options.fetch.enabled) {
    const fetched = fetchBase(root, named, git);
    if (!fetched.ok) {
      const { cause, verb } = fetchFailure(fetched);
      stale = {
        cause,
        detail: `git fetch origin ${named} ${verb}: ${gitFailure2(fetched, "git exited non-zero")}`
      };
    }
  }
  if (!refExists(root, baseRef, git)) {
    return {
      error: {
        code: "base-ref-missing",
        detail: `${baseRef} does not exist locally; ${stale?.detail ?? noFetchDetail(options.fetch, remote)}`
      }
    };
  }
  const counts = changeCounts(root, git);
  const upstream2 = upstream(root, git);
  return {
    ...stale !== void 0 ? { stale } : {},
    tree: {
      path: root,
      remote,
      branch,
      defaultBranch: named,
      baseRef,
      staged: counts.staged,
      unstaged: counts.unstaged,
      upstream: upstream2,
      unpushed: upstream2 === null ? null : unpushedCount(root, git),
      commits: commitsAhead(root, baseRef, git),
      fetch: options.fetch
    }
  };
}
function transitionCandidates(payload) {
  const raw = extractArrayPayload(payload, ["transitions"]) ?? [];
  return raw.flatMap((value) => {
    if (!isJsonObject(value)) return [];
    const id = typeof value.id === "string" ? value.id : typeof value.id === "number" ? String(value.id) : void 0;
    const to = isJsonObject(value.to) && typeof value.to.name === "string" ? value.to.name : void 0;
    const status = isJsonObject(value.status) && typeof value.status.name === "string" ? value.status.name : void 0;
    const toName = typeof value.toName === "string" ? value.toName : void 0;
    const name = typeof value.name === "string" ? value.name : void 0;
    const target = to ?? toName ?? status ?? name;
    if (id === void 0 || target === void 0) return [];
    return [{ id, name: name ?? target, to: target }];
  });
}
function chooseTransition(candidates, from, chosen) {
  if (chosen !== void 0) {
    if (lower(from) === lower(chosen)) {
      return { action: "skip", from, reason: `Already ${from}`, candidates };
    }
    const picked = candidates.find(
      (candidate) => lower(candidate.to) === lower(chosen) || lower(candidate.name) === lower(chosen)
    );
    if (picked) return { action: "transition", from, ...picked, candidates };
    return { action: "not-advertised", from, chosen, candidates };
  }
  if (REVIEW_LIKE.test(String(from ?? ""))) {
    return { action: "skip", from, reason: `Already ${from}`, candidates };
  }
  const reviewLike = candidates.filter((candidate) => REVIEW_LIKE.test(candidate.to));
  if (reviewLike.length === 1) {
    return { action: "transition", from, ...reviewLike[0], candidates: reviewLike };
  }
  if (reviewLike.length > 1) return { action: "ask", from, candidates: reviewLike };
  return {
    action: "unavailable",
    from,
    reason: `No review-like transition from ${from ?? "the current status"}; pass --status <name> to pick one`,
    candidates
  };
}
function planTransition(status, discover, options) {
  const from = status.name;
  if (!options.wanted) return { action: "skip", from, reason: "--no-transition", candidates: [] };
  if (lower(status.category) === CATEGORY_DONE) {
    return { action: "skip", from, reason: `The item is already ${from}`, candidates: [] };
  }
  const discovered = discover();
  if (!discovered.ok) {
    return {
      action: "unavailable",
      from,
      reason: `Discovering transitions failed: ${discovered.detail ?? "twg exited non-zero"}`,
      candidates: []
    };
  }
  return chooseTransition(transitionCandidates(discovered.payload), from, options.chosen);
}
function itemOf(stored, site) {
  const siteUrl = typeof stored.site === "string" ? stored.site : null;
  return {
    item: {
      key: stored.key,
      summary: stored.summary,
      url: siteUrl ? browseUrl(siteUrl, stored.key) : null,
      status: {
        name: stored.status?.name ?? null,
        category: stored.status?.statusCategory?.key ?? null
      }
    },
    site: site ?? (siteUrl ? hostLabel(siteUrl) : null),
    cloudId: stored.cloudId
  };
}
async function readItem2(key, options) {
  try {
    const stored = await fetchWorkItem({
      key,
      site: options.site,
      scope: options.scope ?? "session",
      memory: options.memory,
      runner: options.runner,
      env: options.env
    });
    return itemOf(stored, options.site);
  } catch (error) {
    if (!(error instanceof FetchWorkItemError)) throw error;
    if (error.code === "wrong-site" || error.code === "cloud-id-unresolved") {
      return {
        reasons: [{ code: "site-unresolved", detail: error.message }],
        sites: error.sites
      };
    }
    return { reasons: [{ code: error.code, detail: error.message }] };
  }
}
function checkArguments4(options) {
  const key = options.key === void 0 ? void 0 : issueKeyArgument(options.key);
  const pairs = [
    ["--fields", options.fields, "--fields-file", options.fieldsFile],
    ["--comment-raw", options.commentRaw, "--comment-raw-file", options.commentRawFile],
    [
      "--pull-request-raw",
      options.pullRequestRaw,
      "--pull-request-raw-file",
      options.pullRequestRawFile
    ]
  ];
  for (const [inline, inlineValue, file, fileValue] of pairs) {
    if (inlineValue !== void 0 && fileValue !== void 0) {
      throw new UsageError(`${inline} and ${file} exclude each other`);
    }
  }
  for (const artefact of ARTEFACTS) {
    const raw = rawFlag(options, artefact);
    const template = TEMPLATE_FLAG[artefact];
    if (raw !== void 0 && templateName(options, artefact) !== void 0) {
      throw new UsageError(`${raw} and ${template} exclude each other`);
    }
  }
  if (options.status !== void 0 && options.transition === false) {
    throw new UsageError("--status and --no-transition exclude each other");
  }
  if (options.noPullRequest) {
    if (options.title !== void 0) {
      throw new UsageError("--no-pull-request and --title exclude each other");
    }
    if (options.draft) {
      throw new UsageError("--no-pull-request and --draft exclude each other");
    }
  }
  return key;
}
var ARTEFACTS = ["comment", "pullRequest"];
var KIND = {
  comment: "comment",
  pullRequest: "pull-request"
};
var TEMPLATE_FLAG = {
  comment: "--comment-template",
  pullRequest: "--pull-request-template"
};
var LABEL = {
  comment: "comment",
  pullRequest: "pull request"
};
var templateName = (options, artefact) => artefact === "comment" ? options.commentTemplate : options.pullRequestTemplate;
function rawFlag(options, artefact) {
  if (artefact === "comment") {
    if (options.commentRaw !== void 0) return "--comment-raw";
    return options.commentRawFile !== void 0 ? "--comment-raw-file" : void 0;
  }
  if (options.pullRequestRaw !== void 0) return "--pull-request-raw";
  return options.pullRequestRawFile !== void 0 ? "--pull-request-raw-file" : void 0;
}
function keyFromBranch(branch) {
  const keys = extractIssueKeys(branch);
  if (keys.length === 1) return keys[0];
  throw new UsageError(
    keys.length === 0 ? `--key is required: ${branch} carries no issue key` : `--key is required: ${branch} carries ${keys.join(" and ")}`
  );
}
var fieldsInvalid = (detail) => ({
  error: { code: "fields-invalid", detail }
});
function readInputs(options) {
  const read = options.readFile ?? ((path8) => readFileSync4(path8, "utf8"));
  let fieldsText;
  const raw = {};
  try {
    fieldsText = options.fieldsFile !== void 0 ? read(options.fieldsFile) : options.fields;
    raw.comment = options.commentRawFile !== void 0 ? read(options.commentRawFile) : options.commentRaw;
    raw.pullRequest = options.pullRequestRawFile !== void 0 ? read(options.pullRequestRawFile) : options.pullRequestRaw;
  } catch (error) {
    return {
      error: {
        code: "input-unreadable",
        detail: error instanceof Error ? error.message : String(error)
      }
    };
  }
  const fields = {};
  if (fieldsText !== void 0) {
    let parsed;
    try {
      parsed = JSON.parse(fieldsText);
    } catch (error) {
      return fieldsInvalid(
        `The fields are not JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (!isObject(parsed)) {
      return fieldsInvalid(
        "The fields are not an object; one keyed `comment` and `pullRequest` is expected."
      );
    }
    for (const [name, value] of Object.entries(parsed)) {
      if (name !== "comment" && name !== "pullRequest") {
        return fieldsInvalid(
          `\`${name}\` is not a body; the keys are \`comment\` and \`pullRequest\`.`
        );
      }
      if (!isObject(value)) {
        return fieldsInvalid(`\`${name}\` is not an object of field values.`);
      }
      fields[name] = value;
    }
  }
  for (const artefact of ARTEFACTS) {
    const flag = rawFlag(options, artefact);
    if (flag !== void 0 && fields[artefact] !== void 0) {
      throw new UsageError(`${flag} and ${artefact} fields exclude each other`);
    }
  }
  return { fields, raw };
}
var sourceOf = (prepared) => prepared.kind === "raw" ? "raw" : prepared.resolved.source;
function pickTemplate(artefact, name, path8, git) {
  const kind = KIND[artefact];
  if (name !== void 0) return resolveTemplate(kind, name, path8, git);
  const inForce = resolveTemplates(kind, path8, git);
  if (inForce.length === 1) return inForce[0];
  const names = inForce.map((entry) => entry.template.name).join(", ");
  throw new UsageError(
    `${inForce.length} ${LABEL[artefact]} templates are in force (${names}); pick one with ${TEMPLATE_FLAG[artefact]}`
  );
}
function prepareBodies(options, inputs, wanted, path8, git) {
  const failures = [];
  const prepare = (artefact) => {
    if (!wanted[artefact]) return null;
    const raw = inputs.raw[artefact];
    if (raw !== void 0) return { artefact, kind: "raw", text: raw };
    try {
      const resolved = pickTemplate(artefact, templateName(options, artefact), path8, git);
      return { artefact, kind: "template", resolved, fields: inputs.fields[artefact] ?? {} };
    } catch (error) {
      const reason = templateErrorReason(error);
      if (reason === void 0) throw error;
      failures.push({ ...reason, artefact });
      return null;
    }
  };
  return { comment: prepare("comment"), pullRequest: prepare("pullRequest"), failures };
}
var templatePlan = (prepared) => {
  if (prepared === null) return null;
  if (prepared.kind === "raw") return { name: null, source: "raw", path: null, fields: [] };
  const { resolved } = prepared;
  return {
    name: resolved.template.name,
    source: resolved.source,
    path: resolved.path,
    fields: resolved.template.fields
  };
};
function checkFields(bodies) {
  const failures = [];
  const caveats = [];
  const missing = [];
  for (const prepared of bodies) {
    if (prepared === null || prepared.kind === "raw") continue;
    const { artefact, resolved, fields } = prepared;
    for (const reason of verifyFields(resolved.template, fields)) {
      if (reason.code === "field-missing") {
        const field = resolved.template.fields.find((each) => each.name === reason.field);
        if (field === void 0) {
          throw new Error(`field-missing named no field of the ${artefact} template`);
        }
        missing.push({ artefact, name: field.name, guidance: field.guidance });
        continue;
      }
      (reason.status === "fail" ? failures : caveats).push(reasonOf(artefact, reason));
    }
  }
  return { failures, missing, caveats };
}
function reasonOf(artefact, reason) {
  return {
    code: reason.code,
    detail: `${LABEL[artefact]}: ${reason.detail}`,
    artefact,
    ...reason.field === void 0 ? {} : { field: reason.field },
    ...reason.label === void 0 ? {} : { label: reason.label }
  };
}
function required(prepared) {
  if (prepared === null) throw new Error("A body the plan writes was not prepared");
  return prepared;
}
function bodyOf(prepared, facts) {
  return prepared.kind === "raw" ? prepared.text : renderDocument(prepared.resolved.template, prepared.fields, facts);
}
function missingDetail(missing) {
  const names = missing.map(({ artefact, name }) => `${artefact}.${name}`).join(", ");
  return `Required fields not given: ${names}; re-run with --fields carrying them`;
}
var commentFacts = (item, tree, provider, pullRequest, skipDetail) => ({
  ...itemFacts(item),
  ...pullRequestFacts(pullRequest, skipDetail),
  ...treeFacts(tree.remote, tree.branch, tree.commits, provider ?? null)
});
var descriptionFacts = (item, tree, provider) => ({
  ...itemFacts(item),
  ...treeFacts(tree.remote, tree.branch, tree.commits, provider ?? null)
});
var commentUrl = (itemUrl2, id) => itemUrl2 && id !== null ? `${itemUrl2}?focusedCommentId=${id}` : null;
function commentIdOf(payload) {
  const id = createdCommentOf(payload)?.id;
  return id === void 0 ? null : String(id);
}
function afterOf(stored) {
  return {
    assignee: stored.assignee ? { displayName: stored.assignee.displayName } : null,
    status: {
      name: stored.status?.name ?? null,
      category: stored.status?.statusCategory?.key ?? null
    }
  };
}
async function publishChanges(input) {
  const given = checkArguments4(input);
  const git = input.git ?? runGit;
  const location = locateTree2(input.path, git);
  let key;
  if (given !== void 0) {
    key = given;
  } else if ("error" in location) {
    throw new UsageError(`--key is required: ${location.error.detail}`);
  } else {
    key = keyFromBranch(location.located.branch);
  }
  const keySource = given === void 0 ? "branch" : "--key";
  const found = "error" in location ? location : readTree2(location.located, {
    git,
    dest: input.dest,
    fetch: await resolveFetch(input.fetch, location.located.remote, input.memory.plugin)
  });
  const options = {
    ...input,
    key,
    site: input.site ?? await resolveIndexedSite(input.memory, key)
  };
  const runner = options.runner ?? runTwgJson;
  const env = options.env ?? process.env;
  const gh = {
    // Resolve against the command's `env`, like twg's binary, so a caller-supplied
    // GH_BIN/PATH is honoured rather than silently falling back to process.env.
    resolveBinary: options.resolveGh ?? ((binEnv) => resolveGhBinary(binEnv ?? env)),
    runJson: options.ghJson ?? runGhJson,
    runText: options.ghText ?? runGhText
  };
  const planOnly = options.planOnly ?? false;
  const mode = planOnly ? "plan" : "apply";
  const wantComment = options.comment ?? true;
  const wantTransition = options.transition ?? true;
  const empty = {
    key,
    keySource,
    site: options.site ?? null,
    mode,
    item: null,
    tree: null,
    plan: null,
    applied: [],
    pullRequest: null,
    comment: null,
    transition: null,
    after: null
  };
  const read = await readItem2(key, options);
  if ("reasons" in read) {
    return fail(PUBLISH_CHANGES_SCHEMA, read.reasons, {
      ...empty,
      ...read.sites !== void 0 ? { sites: read.sites } : {}
    });
  }
  const { item, site, cloudId } = read;
  let binary;
  try {
    binary = resolveTwgBinary(env);
  } catch (error) {
    if (!(error instanceof TwgNotFoundError)) throw error;
    return fail(PUBLISH_CHANGES_SCHEMA, [{ code: "twg-not-found", detail: error.message }], {
      ...empty,
      site,
      item
    });
  }
  if ("error" in found) {
    return fail(PUBLISH_CHANGES_SCHEMA, [found.error], {
      ...empty,
      site,
      item
    });
  }
  const { tree } = found;
  const common = { ...empty, site, item, tree };
  if (tree.branch === tree.defaultBranch) {
    return fail(
      PUBLISH_CHANGES_SCHEMA,
      [
        {
          code: "on-default-branch",
          detail: `${tree.path} is on ${tree.branch}; a pull request needs a work branch. Create one and re-run`
        }
      ],
      common
    );
  }
  const inputs = readInputs(options);
  if ("error" in inputs) {
    return fail(PUBLISH_CHANGES_SCHEMA, [inputs.error], common);
  }
  if (tree.commits.length === 0) {
    return fail(
      PUBLISH_CHANGES_SCHEMA,
      [
        {
          code: "nothing-to-publish",
          detail: `${tree.branch} has no commits ahead of ${tree.baseRef}`
        }
      ],
      common
    );
  }
  const pushPlan = tree.upstream === null || (tree.unpushed ?? 0) > 0 ? {
    action: "push",
    branch: tree.branch,
    reason: tree.upstream === null ? "No upstream" : `${tree.unpushed} unpushed commit(s)`
  } : { action: "skip", reason: "Nothing unpushed" };
  const provider = providerFor(tree.remote, { binary, runner, gh });
  let skipPlan;
  let existing;
  if (options.noPullRequest) {
    skipPlan = {
      action: "skip",
      reason: "no-pull-request-flag",
      detail: "--no-pull-request was given"
    };
  } else if (provider === void 0) {
    skipPlan = {
      action: "skip",
      reason: "no-provider",
      detail: `no pull request provider for ${tree.remote.host}`
    };
  } else {
    const availability = provider.available();
    if (!availability.ok) {
      const preference = provider.name === "github" ? await getGithubPullRequestsPreference(options.memory.plugin) : void 0;
      if (preference?.preference === "skip") {
        skipPlan = { action: "skip", reason: availability.reason, detail: availability.detail };
      } else {
        return warn(
          PUBLISH_CHANGES_SCHEMA,
          [{ code: availability.reason, detail: availability.detail }],
          common
        );
      }
    } else {
      const openPr = provider.findOpen(tree);
      if (!openPr.ok) {
        if (openPr.reason !== void 0) {
          return warn(
            PUBLISH_CHANGES_SCHEMA,
            [{ code: openPr.reason, detail: openPr.detail }],
            common
          );
        }
        return fail(
          PUBLISH_CHANGES_SCHEMA,
          [
            {
              code: "pull-request-query-failed",
              detail: `Querying open pull requests on ${tree.branch} failed: ${openPr.detail}`
            }
          ],
          common
        );
      }
      existing = openPr.value;
    }
  }
  const creating = skipPlan === void 0 && existing === void 0;
  const bodies = prepareBodies(
    options,
    inputs,
    { comment: wantComment, pullRequest: creating },
    tree.path,
    git
  );
  if (bodies.failures.length > 0) {
    return fail(PUBLISH_CHANGES_SCHEMA, bodies.failures, common);
  }
  const checks = checkFields([bodies.comment, bodies.pullRequest]);
  if (checks.failures.length > 0) {
    return fail(PUBLISH_CHANGES_SCHEMA, checks.failures, common);
  }
  const reviewedPullRequestDescription = () => bodyOf(required(bodies.pullRequest), descriptionFacts(item, tree, provider));
  const pullRequestPlan = skipPlan ?? (existing ? {
    action: "existing",
    url: existing.url,
    id: existing.id,
    dest: tree.defaultBranch,
    reason: `An open pull request already exists for ${tree.branch}: ${existing.url}`
  } : {
    action: "create",
    title: options.title ?? `${key}: ${item.summary ?? ""}`.trim(),
    dest: tree.defaultBranch,
    draft: options.draft ?? false,
    source: sourceOf(required(bodies.pullRequest)),
    ...planOnly ? { description: reviewedPullRequestDescription() } : {}
  });
  const alreadySettled = lower(item.status.category) === CATEGORY_DONE || REVIEW_LIKE.test(String(item.status.name ?? ""));
  const transitionSkippedForNoPr = pullRequestPlan.action === "skip" && wantTransition && options.status === void 0 && !alreadySettled;
  const reviewedComment = bodies.comment === null ? null : bodyOf(
    bodies.comment,
    commentFacts(item, tree, provider, existing ?? null, skipPlan?.detail)
  );
  const reviewedPullRequest = pullRequestPlan.action === "create" ? reviewedPullRequestDescription() : null;
  const digestOf2 = (text6) => text6 === null ? null : createHash2("sha256").update(text6).digest("hex");
  const reviewDigests = {
    comment: digestOf2(reviewedComment),
    pullRequest: digestOf2(reviewedPullRequest)
  };
  const standing = await getReviewPreferences(options.memory.plugin).catch(() => void 0);
  const skipCommentReview = options.skipCommentReview === true || standing?.comment === "skip";
  const skipPullRequestReview = options.skipPullRequestReview === true || standing?.pullRequest === "skip";
  const reviewSkipped = [
    ...standing?.comment === "skip" && reviewDigests.comment !== null ? ["comment"] : [],
    ...standing?.pullRequest === "skip" && reviewDigests.pullRequest !== null ? ["pull request description"] : []
  ];
  const previews = createJiraReviewPreviewStore(
    (options.scope ?? "session") === "session" ? options.memory.session : options.memory.plugin
  );
  const plan = {
    push: pushPlan,
    pullRequest: pullRequestPlan,
    comment: bodies.comment === null ? { action: "skip", reason: "--no-comment" } : {
      action: "comment",
      source: sourceOf(bodies.comment),
      ...planOnly && reviewedComment !== null ? { body: reviewedComment } : {}
    },
    transition: transitionSkippedForNoPr ? {
      action: "skip",
      from: item.status.name,
      reason: "The pull request was skipped; there is no review to move to",
      candidates: []
    } : planTransition(
      item.status,
      () => runner(binary, ["jira", "workitem", "transition", "--id", key], { site: options.site }),
      { wanted: wantTransition, chosen: options.status }
    ),
    templates: {
      comment: templatePlan(bodies.comment),
      pullRequest: templatePlan(bodies.pullRequest)
    },
    ...reviewSkipped.length > 0 ? { reviewSkipped } : {}
  };
  const planned = {
    ...common,
    plan,
    ...checks.missing.length > 0 ? { fields: { missing: checks.missing } } : {}
  };
  if (planOnly) {
    try {
      await previews.setReviewPreview(cloudId, asIssueKey(key), {
        ...reviewDigests.comment !== null ? { comment: reviewDigests.comment } : {},
        ...reviewDigests.pullRequest !== null ? { pullRequest: reviewDigests.pullRequest } : {}
      });
    } catch {
    }
  }
  const decisions = [];
  if (!planOnly) {
    const previewed = await previews.getReviewPreview(cloudId, asIssueKey(key)).catch(() => void 0);
    const unreviewed = [
      ...reviewDigests.comment !== null && !skipCommentReview && previewed?.comment !== reviewDigests.comment ? ["comment"] : [],
      ...reviewDigests.pullRequest !== null && !skipPullRequestReview && previewed?.pullRequest !== reviewDigests.pullRequest ? ["pull request description"] : []
    ];
    if (unreviewed.length > 0) {
      decisions.push({
        code: "review-needed",
        detail: `The ${unreviewed.join(" and ")} as now rendered ${unreviewed.length > 1 ? "have" : "has"} not been shown to the user. Run again with --plan-only, show plan.comment.body and plan.pullRequest.description, and publish once the user approves; or add --skip-comment-review or --skip-pull-request-review where the user said that body needs no review`
      });
    }
  }
  if (!planOnly && checks.missing.length > 0) {
    decisions.push({ code: "field-missing", detail: missingDetail(checks.missing) });
  }
  if (keySource === "--key" && !carriesKey(tree.branch, key) && !options.allowBranchWithoutKey) {
    decisions.push({
      code: "branch-without-key",
      detail: `${tree.branch} does not carry ${key}; re-run with --allow-branch-without-key to publish from it`
    });
  }
  if (plan.transition.action === "ask") {
    decisions.push({
      code: "transition-ambiguous",
      detail: `${key} has ${plan.transition.candidates.length} review-like transitions; re-run with --status <name>`
    });
  }
  if (plan.transition.action === "not-advertised") {
    decisions.push({
      code: "status-not-advertised",
      detail: `"${plan.transition.chosen}" is not a transition from ${plan.transition.from ?? "the current status"}`
    });
  }
  if (decisions.length > 0) {
    return warn(PUBLISH_CHANGES_SCHEMA, decisions, planned);
  }
  const caveats = [
    ...found.stale !== void 0 ? [
      {
        code: "base-stale",
        detail: `${found.stale.detail}; the commits ahead of ${tree.baseRef} were counted against the tip this tree last fetched`,
        cause: found.stale.cause
      }
    ] : [],
    ...checks.caveats
  ];
  if (plan.transition.action === "unavailable") {
    caveats.push({ code: "transition-unavailable", detail: plan.transition.reason });
  }
  if (transitionSkippedForNoPr) {
    caveats.push({
      code: "transition-skipped-no-pull-request",
      detail: `No pull request was opened, so ${key} was not moved to review; re-run with --status <name> to move it anyway`
    });
  }
  const reused = existing === void 0 ? null : { url: existing.url, id: existing.id, reused: true };
  if (planOnly) {
    const extra = { ...planned, pullRequest: reused };
    return caveats.length > 0 ? warn(PUBLISH_CHANGES_SCHEMA, caveats, extra) : pass(PUBLISH_CHANGES_SCHEMA, extra);
  }
  const verdict = applyPlan2({
    key,
    binary,
    runner,
    git,
    provider,
    site: options.site,
    item,
    tree,
    plan,
    bodies,
    existing,
    caveats,
    planned,
    readBack: async () => {
      const stored = await fetchWorkItem({
        key,
        site: options.site,
        scope: options.scope ?? "session",
        memory: options.memory,
        runner: options.runner,
        env: options.env
      });
      return afterOf(stored);
    }
  });
  const finished = await verdict;
  await storeVerdict(options, cloudId, key, finished);
  return finished;
}
async function storeVerdict(options, cloudId, key, verdict) {
  try {
    const store = (options.scope ?? "session") === "session" ? options.memory.session : options.memory.plugin;
    await createJiraPublishVerdictStore(store).setPublishVerdict(
      cloudId,
      asIssueKey(key),
      JSON.parse(JSON.stringify(verdict))
    );
  } catch {
  }
}
async function applyPlan2(context) {
  const { key, binary, runner, git, provider, site, item, tree, plan, bodies, caveats, planned } = context;
  const jira = { site };
  const applied = [];
  let pullRequest = context.existing ?? null;
  let comment = null;
  let transition = null;
  let after = null;
  const finish = (status, failure) => {
    const extra = {
      ...planned,
      applied,
      pullRequest: pullRequest === null ? null : { url: pullRequest.url, id: pullRequest.id, reused: context.existing !== void 0 },
      comment,
      transition,
      after
    };
    const panels = publishLines(applied, {
      branchUrl: provider ? (branch) => provider.branchUrl(tree.remote, branch) : void 0,
      itemUrl: item.url
    });
    if (status === "fail" && failure !== void 0) {
      return fail(PUBLISH_CHANGES_SCHEMA, [...caveats, failure], extra, {
        panels
      });
    }
    return caveats.length > 0 ? warn(PUBLISH_CHANGES_SCHEMA, caveats, extra, { panels }) : pass(PUBLISH_CHANGES_SCHEMA, extra, { panels });
  };
  const stop = (step, detail) => finish("fail", { code: "write-failed", detail: `${step}: ${detail}`, step });
  if (plan.push.action === "push") {
    const pushed = push(tree.path, "origin", tree.branch, { setUpstream: true }, git);
    if (!pushed.ok) return stop("push", gitFailure2(pushed, "git push failed"));
    applied.push({ step: "push", ok: true, branch: tree.branch });
  }
  if (plan.pullRequest.action === "create") {
    const create = plan.pullRequest;
    if (provider === void 0) {
      throw new Error("A create pull request plan requires a provider");
    }
    const body = bodyOf(required(bodies.pullRequest), descriptionFacts(item, tree, provider));
    const created = provider.create(tree, {
      title: create.title,
      dest: create.dest,
      body,
      draft: create.draft
    });
    if (!created.ok) return stop("pull-request", created.detail);
    pullRequest = created.value ?? null;
    if (pullRequest === null) {
      return stop(
        "pull-request",
        "The create returned no pull request URL and none is open on the branch"
      );
    }
    applied.push({ step: "pull-request", ok: true, action: "create", ...pullRequest });
  } else if (plan.pullRequest.action === "existing") {
    applied.push({
      step: "pull-request",
      ok: true,
      action: "existing",
      id: plan.pullRequest.id,
      url: plan.pullRequest.url,
      title: pullRequest?.title ?? null
    });
  } else {
    applied.push({
      step: "pull-request",
      ok: true,
      action: "skip",
      reason: plan.pullRequest.reason,
      detail: plan.pullRequest.detail
    });
  }
  if (plan.comment.action === "comment") {
    const facts = commentFacts(
      item,
      tree,
      provider,
      pullRequest,
      plan.pullRequest.action === "skip" ? plan.pullRequest.detail : void 0
    );
    const markdown = bodyOf(required(bodies.comment), facts);
    const smartLinks = new Set(
      [facts["pullRequest.url"], facts["branch.url"], facts["commit.url"]].filter(
        (url) => !!url
      )
    );
    const posted = runner(
      binary,
      [
        "jira",
        "workitem",
        "comment",
        "create",
        "--issue-id",
        key,
        "--body",
        markdownToHtml(markdown, smartLinks)
      ],
      jira
    );
    if (!posted.ok) return stop("comment", posted.detail ?? "twg exited non-zero");
    const id = commentIdOf(posted.payload);
    comment = { id, url: commentUrl(item.url, id) };
    applied.push({ step: "comment", ok: true, id });
  }
  if (plan.transition.action === "transition") {
    const moved = runner(
      binary,
      ["jira", "workitem", "transition", "--id", key, "--transition-id", plan.transition.id],
      { ...jira, timeoutMs: MIN_TRANSITION_TIMEOUT_MS }
    );
    try {
      after = await context.readBack();
    } catch {
      after = null;
    }
    if (!moved.ok) return stop("transition", moved.detail ?? "twg exited non-zero");
    const landed = after === null || lower(after.status.name) === lower(plan.transition.to);
    if (!landed) {
      caveats.push({
        code: "read-back-mismatch",
        detail: `The transition returned ok but ${key} reads back as ${after?.status.name ?? "unknown"}`
      });
    }
    transition = { from: plan.transition.from, to: after?.status.name ?? plan.transition.to };
    applied.push({ step: "transition", ok: true, ...transition });
  }
  return finish(caveats.length > 0 ? "warn" : "pass");
}

// ../../plugins/jira/src/commands/changes.ts
var GITHUB_PULL_REQUESTS_PREFERENCE_SCHEMA = "jira-workflows/github-pull-requests-preference/v1";
var REVIEW_PREFERENCE_SCHEMA = "jira-workflows/review-preference/v1";
function registerChangesCommands(program2, options) {
  const stores = createClaudeStores(options);
  const memory = createJiraMemory(stores);
  const scope = options.sessionId !== void 0 ? "session" : "plugin";
  const changes = program2.command("changes").description("The change set for a work item's work");
  changes.command("publish").description(
    "Push committed work, open or reuse the pull request, post the writeback comment, and move the item into review; prints a verdict"
  ).option(
    "--key <issue-key>",
    "Jira issue key; defaults to the one issue key the branch name carries"
  ).option(
    "--path <dir>",
    "an absolute path inside the working tree; defaults to the current directory"
  ).option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).option("--plan-only", "plan and report; write nothing").option(
    "--fields <json>",
    "the values of the comment and pull request templates' fields: one object keyed `comment` and `pullRequest`, each an object keyed by field name; a body with no key was given none"
  ).option("--fields-file <path>", "the same, read from a file").option(
    "--comment-template <name>",
    "the comment template to render; defaults to the one in force, and is required where several are"
  ).option(
    "--pull-request-template <name>",
    "the pull request template to render; defaults to the one in force, and is required where several are"
  ).option(
    "--comment-raw <text>",
    "post this text as the comment, resolving no template; excludes --comment-template and comment fields"
  ).option("--comment-raw-file <path>", "the same, read from a file").option(
    "--pull-request-raw <text>",
    "use this text as the pull request description, resolving no template; excludes --pull-request-template and pullRequest fields"
  ).option("--pull-request-raw-file <path>", "the same, read from a file").option("--title <text>", 'the pull request title; defaults to "<KEY>: <item summary>"').option(
    "--dest <branch>",
    "the branch the pull request targets; defaults to the branch origin/HEAD names"
  ).option("--draft", "open the pull request as a draft").option(
    "--no-pull-request",
    "skip opening the pull request, recording why; the push and writeback still run"
  ).option("--allow-branch-without-key", "publish from a branch whose name does not carry the key").option(
    "--status <name>",
    "the transition to take, where the discovery advertises several review-like ones or none"
  ).option("--no-comment", "do not post the writeback comment").option(
    "--skip-comment-review",
    "post the comment without a matching --plan-only preview, where the user said it needs no review"
  ).option(
    "--skip-pull-request-review",
    "open the pull request without a matching --plan-only preview, where the user said its description needs no review"
  ).option("--no-transition", "leave the item's status alone").option(
    "--no-fetch",
    "do not refresh origin/<destination branch> before reading what is ahead of it"
  ).action(async (opts, command) => {
    const verdict = await publishChanges({
      key: opts.key,
      path: opts.path ?? process.cwd(),
      site: opts.site,
      planOnly: opts.planOnly,
      fields: opts.fields,
      fieldsFile: opts.fieldsFile,
      commentTemplate: opts.commentTemplate,
      pullRequestTemplate: opts.pullRequestTemplate,
      commentRaw: opts.commentRaw,
      commentRawFile: opts.commentRawFile,
      pullRequestRaw: opts.pullRequestRaw,
      pullRequestRawFile: opts.pullRequestRawFile,
      title: opts.title,
      dest: opts.dest,
      draft: opts.draft,
      noPullRequest: !opts.pullRequest,
      allowBranchWithoutKey: opts.allowBranchWithoutKey,
      status: opts.status,
      comment: opts.comment,
      skipCommentReview: opts.skipCommentReview,
      skipPullRequestReview: opts.skipPullRequestReview,
      transition: opts.transition,
      fetch: fetchFlag(command),
      memory,
      scope
    });
    printVerdict(await withSessionLinkResult(verdict, options, stores));
    for (const adoption of adoptionsFromPublish(verdict)) noteAdoption(adoption);
  });
  changes.command("github-pull-requests").description(
    "Record whether to publish without opening GitHub pull requests: skip (and stop asking) or ask"
  ).argument(
    "<preference>",
    '"skip" to publish without a GitHub pull request and stop asking, or "ask"'
  ).action(async (preference) => {
    if (preference !== "skip" && preference !== "ask") {
      throw new UsageError(`<preference> must be "skip" or "ask", not "${preference}"`);
    }
    await setGithubPullRequestsPreference(stores.plugin, { preference });
    printVerdict(pass(GITHUB_PULL_REQUESTS_PREFERENCE_SCHEMA, { preference }));
  });
  changes.command("review-preference").description(
    "Record whether to publish the writeback comment or the pull request description without reviewing it first: skip (and stop asking) or ask"
  ).argument("<body>", '"comment" or "pull-request"').argument("<preference>", '"skip" to publish that body without a review, or "ask"').action(async (body, preference) => {
    if (!isReviewBody(body)) {
      throw new UsageError(`<body> must be "comment" or "pull-request", not "${body}"`);
    }
    if (!isReviewPreference(preference)) {
      throw new UsageError(`<preference> must be "skip" or "ask", not "${preference}"`);
    }
    const preferences = await setReviewPreference(stores.plugin, body, preference);
    printVerdict(pass(REVIEW_PREFERENCE_SCHEMA, { body, preference, preferences }));
  });
  return program2;
}

// ../../plugins/jira/src/template/init.ts
import { mkdirSync as mkdirSync2, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join8 } from "node:path";
var TEMPLATE_INIT_SCHEMA = "jira-workflows/template-init/v1";
var BLANK_WORK_ITEM = `schema: 1
kind: work-item
description: A custom work-item template.
fields: []
`;
function defaultFrom(kind) {
  return kind === "work-item" ? void 0 : "default";
}
function sources(kind, inForce) {
  const builtIns = builtInTemplates(kind).map((template) => ({
    template,
    source: "built-in",
    path: null
  }));
  const byName = /* @__PURE__ */ new Map();
  for (const entry of [...inForce, ...builtIns]) {
    if (!byName.has(entry.template.name)) byName.set(entry.template.name, entry);
  }
  return [...byName.values()];
}
function resolveFrom(kind, from, available) {
  const found = available.find((entry) => entry.template.name === from);
  if (found === void 0) {
    throw new TemplateNotFoundError(
      kind,
      from,
      available.map((entry) => entry.template.name)
    );
  }
  return found;
}
function initTemplate(kind, name, from, path8, options = {}) {
  const target = { kind, name };
  const none = (source = null, candidates = []) => ({
    template: target,
    path: null,
    from: { name: from ?? null, source },
    candidates,
    hidden: []
  });
  if (!isTemplateName(name)) {
    const error = new TemplateInvalidError(
      `${name}.yaml`,
      "name",
      `The name "${name}" does not match [a-z][a-z0-9-]*.`
    );
    return fail(TEMPLATE_INIT_SCHEMA, [{ code: "template-invalid", detail: error.detail }], none());
  }
  const root = topLevel(path8);
  if (root === null) {
    return fail(
      TEMPLATE_INIT_SCHEMA,
      [{ code: "not-a-git-tree", detail: `${path8} is not inside a git working tree.` }],
      none()
    );
  }
  try {
    const inForce = resolveTemplates(kind, path8);
    const hadRepoTemplates = inForce.some((entry) => entry.source === "repo");
    const available = sources(kind, inForce);
    if (from === void 0 && options.blank !== true) {
      const candidates = available.map((entry) => ({
        name: entry.template.name,
        source: entry.source,
        description: entry.template.description
      }));
      return warn(
        TEMPLATE_INIT_SCHEMA,
        [
          {
            code: "template-source-needed",
            detail: `Choose a ${kind} template to copy with --from <name>, or create a blank work-item template with --blank.`
          }
        ],
        none(null, candidates)
      );
    }
    const resolved = options.blank === true ? null : resolveFrom(kind, from, available);
    const text6 = resolved === null ? BLANK_WORK_ITEM : templateText(resolved);
    const directory = join8(root, TEMPLATES_DIRECTORY);
    const file = join8(directory, `${name}.yaml`);
    const source = resolved?.source ?? null;
    mkdirSync2(directory, { recursive: true });
    try {
      writeFileSync3(file, text6, { flag: "wx" });
    } catch (error) {
      if (error.code === "EEXIST") {
        return fail(
          TEMPLATE_INIT_SCHEMA,
          [{ code: "template-exists", detail: `${file} already exists; it was not changed.` }],
          none(source)
        );
      }
      throw error;
    }
    const hidden = hadRepoTemplates ? [] : builtInTemplates(kind).map((template) => template.name).filter((each) => each !== resolved?.template.name);
    const extra = {
      template: target,
      path: file,
      from: { name: from ?? null, source },
      candidates: [],
      hidden
    };
    if (hidden.length === 0) return pass(TEMPLATE_INIT_SCHEMA, extra);
    return warn(
      TEMPLATE_INIT_SCHEMA,
      [
        {
          code: "built-ins-hidden",
          detail: `The repo now has ${kind} templates, so the built-in ${kind} templates ${hidden.join(", ")} are no longer in force. Copy any still needed with \`template init <name> --kind ${kind} --from <built-in>\`.`
        }
      ],
      extra
    );
  } catch (error) {
    const reason = templateErrorReason(error);
    if (reason) return fail(TEMPLATE_INIT_SCHEMA, [reason], none());
    throw error;
  }
}

// ../../plugins/jira/src/commands/template.ts
function kindArgument(value) {
  if (value === void 0) return void 0;
  const kind = TEMPLATE_KINDS.find((candidate) => candidate === value);
  if (kind === void 0) {
    throw new UsageError(`--kind is one of ${TEMPLATE_KINDS.join(", ")}; got "${value}"`);
  }
  return kind;
}
function registerTemplateCommands(program2) {
  const template = program2.command("template").description("The templates in force for work items, comments, and pull requests");
  template.command("list").description("List the templates in force; prints a verdict").option("--kind <work-item|comment|pull-request>", "list one kind only").option(
    "--path <dir>",
    "a directory inside the working tree; defaults to the current directory"
  ).action((opts) => {
    printVerdict(listTemplates(kindArgument(opts.kind), opts.path ?? process.cwd()));
  });
  template.command("show").description("Show one template's fields, body, and guidance; prints a verdict").argument("<name>", "the template name, as `template list` gives it").requiredOption("--kind <work-item|comment|pull-request>", "the template kind").option(
    "--path <dir>",
    "a directory inside the working tree; defaults to the current directory"
  ).option("--source", "add the template file's raw text to the verdict as `text`").action((name, opts) => {
    const kind = kindArgument(opts.kind);
    if (kind === void 0) throw new UsageError("--kind is required");
    printVerdict(
      showTemplate(kind, name, opts.path ?? process.cwd(), { source: opts.source === true })
    );
  });
  template.command("init").description(
    "Copy a template in force, or a built-in of the kind, into the repo's .jira/templates/ directory; prints a verdict"
  ).argument("<name>", "the new template name, [a-z][a-z0-9-]*").requiredOption("--kind <work-item|comment|pull-request>", "the template kind").option(
    "--from <template>",
    "the template to copy, one in force or a built-in of the kind; defaults to `default` for a comment and a pull request"
  ).option("--blank", "create a valid empty work-item template instead of copying one").option(
    "--path <dir>",
    "a directory inside the working tree; defaults to the current directory"
  ).action((name, opts) => {
    const kind = kindArgument(opts.kind);
    if (kind === void 0) throw new UsageError("--kind is required");
    if (opts.blank === true && opts.from !== void 0) {
      throw new UsageError("--blank and --from cannot be used together");
    }
    if (opts.blank === true && kind !== "work-item") {
      throw new UsageError("--blank is available for a work-item template only");
    }
    const from = opts.from ?? defaultFrom(kind);
    printVerdict(
      initTemplate(kind, name, from, opts.path ?? process.cwd(), { blank: opts.blank === true })
    );
  });
  return program2;
}

// ../../plugins/jira/src/commands/project-context.ts
import { text as text3 } from "node:stream/consumers";

// ../../plugins/jira/src/panels/sites.ts
var SITES_LABEL = 32;
var NUMBER_COLUMN = 4;
function sitesWidths(columns) {
  return columnWidths(columns ?? 80, [NUMBER_COLUMN, SITES_LABEL, null]);
}
function sitesTable(sites, widths = sitesWidths()) {
  const list = (Array.isArray(sites) ? sites : []).map(
    (entry) => typeof entry === "string" ? { name: entry.trim(), url: "" } : { name: String(entry?.name ?? "").trim(), url: String(entry?.url ?? "").trim() }
  ).filter((entry) => entry.name !== "");
  if (list.length === 0) {
    throw new TypeError("Expected an array of sites");
  }
  for (const { name, url } of list) {
    checkValue(name, `Site "${name}"`);
    if (url) {
      checkValue(url, `Site "${name}"'s url`);
    }
  }
  const rows = list.map(({ name, url }, index) => [String(index + 1), name, url]);
  return fencedColumns({ title: `Sites (${list.length})`, rows }, widths);
}

// ../../plugins/jira/src/cloud-sites/render.ts
var NO_OTHER_SITES = "No other sites.\n";
async function renderStoredCloudSites(options) {
  const stored = await options.memory.getCloudSites(asProjectKey(options.projectKey));
  const rendered = renderSites(siteEntriesOf(stored));
  if (stored.length > 0)
    noteAssetRetrieval({
      assetType: CONTENT.site.assetType,
      assetCount: stored.length,
      retrievalSource: "local"
    });
  return rendered;
}
function renderSitesJson(raw) {
  return renderSites(parseSitesJson(raw));
}
function renderSites(sites) {
  if (sites.length === 0) {
    return NO_OTHER_SITES;
  }
  return sitesTable(sites);
}
function siteEntriesOf(stored) {
  return stored.map((site) => ({ name: site.tenantName, url: site.siteUrl }));
}
function parseSitesJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Malformed JSON on stdin: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error('stdin must contain a JSON array of sites: [{ "name", "url" }, ...]');
  }
  return parsed.map((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new Error(`sites[${index}] is not an object`);
    }
    const { name, url } = entry;
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error(`sites[${index}].name must be a non-empty string`);
    }
    if (url !== void 0 && url !== null && typeof url !== "string") {
      throw new Error(`sites[${index}].url must be a string where present`);
    }
    return { name, url: url ?? "" };
  });
}

// ../../plugins/jira/src/commands/projection.ts
function projectRecord(record, declaredFields, fields, latest) {
  if (fields === void 0 || fields.length === 0) {
    return latest ? reduceToLatest(record) : record;
  }
  const base2 = Array.isArray(record) && latest ? reduceToLatest(record) : record;
  let result = {};
  for (const path8 of fields) {
    const segments = path8.split(".");
    const first = segments[0];
    if (first === void 0 || first.length === 0 || !declaredFields.includes(first)) {
      throw new Error(`Unknown field "${path8}": "${first ?? ""}" is not a field of this record`);
    }
    const firstValue = readProperty(base2, first);
    const reducedFirst = latest ? reduceToLatest(firstValue) : firstValue;
    const rest = segments.slice(1);
    const leaf = rest.length === 0 ? normalize3(reducedFirst) : readPath3(reducedFirst, rest);
    result = assignPath(result, segments, leaf);
  }
  return result;
}
function parseFieldsOption(value) {
  if (value === void 0) {
    return void 0;
  }
  const paths = value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return paths.length === 0 ? void 0 : paths;
}
function reduceToLatest(value) {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.length === 0 ? null : value[value.length - 1];
}
function normalize3(value) {
  return value === void 0 ? null : value;
}
function readProperty(value, key) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  return value[key];
}
function readPath3(value, segments) {
  let current = value;
  for (const segment of segments) {
    current = readProperty(current, segment);
    if (current === void 0) {
      return null;
    }
  }
  return normalize3(current);
}
function assignPath(target, segments, value) {
  const [first, ...rest] = segments;
  if (first === void 0) {
    return target;
  }
  if (rest.length === 0) {
    return { ...target, [first]: value };
  }
  const existing = target[first];
  const nested = typeof existing === "object" && existing !== null && !Array.isArray(existing) ? existing : {};
  return { ...target, [first]: assignPath(nested, rest, value) };
}

// ../../plugins/jira/src/commands/project-context.ts
var STDIN_SOURCE = "-";
function registerProjectContextCommands(program2, options) {
  const stores = createClaudeStores(options);
  const memory = createJiraMemory(stores);
  const projectContext = program2.command("project-context").description("Read a Jira project's stored cloud-site context");
  projectContext.command("get").description("Print the stored project context for a Jira cloud/project pair as JSON").requiredOption("--cloud-id <id>", "Jira Cloud site id").requiredOption("--project-id <id>", "Jira project id").option("--fields <a,b.c>", "comma-separated dotted paths; the output holds only those").action(async (opts) => {
    const cloudId = asCloudId(opts.cloudId);
    const projectId = asProjectId(opts.projectId);
    const context = await memory.getProjectContext(cloudId, projectId);
    if (context === void 0) {
      throw new Error(
        `No project context for cloud id "${opts.cloudId}" and project id "${opts.projectId}"`
      );
    }
    const projected = projectRecord(
      context,
      PROJECT_CONTEXT_FIELDS,
      parseFieldsOption(opts.fields),
      false
    );
    console.log(JSON.stringify(projected, null, 2));
    noteAssetRetrieval({
      assetType: CONTENT.project.assetType,
      assetCount: 1,
      retrievalSource: "local",
      retrievedAssets: [{ objectType: CONTENT.project.assetType, objectId: projectId }]
    });
  });
  program2.command("cloud-sites").description("Print the stored cloud sites for a Jira project key as JSON").enablePositionalOptions().option("--project-key <key>", "Jira project key").option("--fields <a,b.c>", "comma-separated dotted paths; the output holds only those").option("--latest", "replace the array with its last element, or null when empty").action(async (opts) => {
    if (opts.projectKey === void 0) {
      throw new UsageError("required option '--project-key <key>' not specified");
    }
    const projectKey = asProjectKey(opts.projectKey);
    const sites = await memory.getCloudSites(projectKey);
    const projected = projectRecord(
      sites,
      CLOUD_SITE_FIELDS,
      parseFieldsOption(opts.fields),
      opts.latest === true
    );
    console.log(JSON.stringify(projected, null, 2));
    const count2 = opts.latest ? Math.min(1, sites.length) : sites.length;
    if (count2 > 0)
      noteAssetRetrieval({
        assetType: CONTENT.site.assetType,
        assetCount: count2,
        retrievalSource: "local"
      });
  });
  return program2;
}
function registerCloudSitesRenderCommands(program2, options) {
  const memory = createJiraMemory(createClaudeStores(options));
  const cloudSites = program2.commands.find((command) => command.name() === "cloud-sites") ?? program2.command("cloud-sites").description("Read the stored cloud sites for a Jira project key").enablePositionalOptions();
  cloudSites.command("render").description(
    "Draw a numbered site chooser as one fenced table, from the stored sites for a project key or from a JSON sites array on stdin"
  ).argument("[source]", `'${STDIN_SOURCE}' to read a JSON sites array [{ name, url }] from stdin`).option("--project-key <key>", "draw the stored sites for this Jira project key").action(async (source, opts) => {
    const fromStdin = source === STDIN_SOURCE;
    if (source !== void 0 && !fromStdin) {
      throw new UsageError(
        `The only source argument is '${STDIN_SOURCE}' (stdin); got "${source}"`
      );
    }
    if (fromStdin === (opts.projectKey !== void 0)) {
      throw new UsageError(
        `Pass exactly one source: --project-key <key>, or '${STDIN_SOURCE}' for a JSON sites array on stdin`
      );
    }
    if (opts.projectKey !== void 0) {
      process.stdout.write(await renderStoredCloudSites({ projectKey: opts.projectKey, memory }));
      return;
    }
    if (process.stdin.isTTY === true) {
      throw new UsageError(
        `'${STDIN_SOURCE}' reads a JSON sites array from stdin; stdin is a terminal, so nothing was read`
      );
    }
    process.stdout.write(renderSitesJson(await text3(process.stdin)));
  });
  return program2;
}

// ../../plugins/jira/src/commands/work-item.ts
import { readFile } from "node:fs/promises";
import { text as text4 } from "node:stream/consumers";

// ../../plugins/jira/src/panels/work-item.ts
function workItemRow(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new TypeError("Expected a work item as an object");
  }
  const key = sanitize(item.key);
  if (key === "") {
    throw new TypeError("Expected a work item carrying its key");
  }
  const summary = sanitize(item.summary);
  const lines = [summary ? `${key}: ${summary}` : key];
  const status = sanitize(item.status?.name);
  if (status) {
    lines.push(`\xB7 Status: ${status}`);
  }
  const assignee = sanitize(item.assignee?.displayName);
  lines.push(`\xB7 Assignee: ${assignee || "none"}`);
  const priority = sanitize(item.priority?.name);
  if (priority) {
    lines.push(`\xB7 Priority: ${priority}`);
  }
  const parent = sanitize(item.parent?.key);
  if (parent) {
    lines.push(`\xB7 Parent: ${parent}`);
  }
  const url = safeUrl(item.url) ?? browseUrl2(item.site, key);
  if (url) {
    lines.push(`\xB7 ${url}`);
  }
  return [sanitize(item.issuetype?.name) || "Work item", lines];
}
function browseUrl2(site, key) {
  const name = sanitize(site);
  if (name === "") {
    return void 0;
  }
  const origin = safeUrl(name);
  return origin !== void 0 ? safeUrl(new URL(`/browse/${key}`, origin).href) : safeUrl(`https://${name}.atlassian.net/browse/${key}`);
}
var HEADING_REGEX = /^\s*#{1,6}\s+/;
var FENCE_REGEX = /^\s*```/;
function detailLines(descriptionMarkdown) {
  const lines = [];
  for (const raw of String(descriptionMarkdown ?? "").split("\n")) {
    if (FENCE_REGEX.test(raw)) {
      continue;
    }
    const line = sanitize(raw.replace(HEADING_REGEX, ""));
    lines.push(line === "" ? BLANK : line);
  }
  const first = lines.findIndex((line) => line !== BLANK);
  if (first === -1) {
    return [];
  }
  let last = lines.length - 1;
  while (lines[last] === BLANK) {
    last -= 1;
  }
  return lines.slice(first, last + 1);
}
function workItemPanel(item, descriptionMarkdown, widths = tableWidths()) {
  const rows = [workItemRow(item)];
  const details = detailLines(descriptionMarkdown);
  if (details.length > 0) {
    rows.push(["Details", details]);
  }
  return fencedTable({ rows }, widths);
}

// ../../plugins/jira/src/panels/claim.ts
var STATES = {
  pass: "\u2713",
  warn: "!",
  "n-a": "-",
  stop: "\u2717"
};
function check(label, state, detail) {
  return [`${STATES[state]} ${label}`, detail];
}
function plural(count2, one, many) {
  return `${count2} ${count2 === 1 ? one : many}`;
}
function claimedItem(verdict) {
  const { item, after } = verdict;
  return {
    key: item.key,
    summary: item.summary,
    url: item.url,
    site: verdict.site,
    issuetype: { name: item.type },
    priority: { name: item.priority },
    parent: { key: item.parent },
    status: { name: after?.status?.name ?? item.status?.name },
    assignee: after?.assignee !== void 0 ? after.assignee : item.assignee
  };
}
function criteriaRow(criteria) {
  if (!criteria) {
    return check("Criteria", "warn", "No Acceptance criteria section");
  }
  if (!criteria.count) {
    return check("Criteria", "warn", "Acceptance criteria carries no bullet");
  }
  return check("Criteria", "pass", plural(criteria.count, "criterion", "criteria"));
}
function assigneeRow(verdict) {
  const { applied, after, user, mode } = verdict;
  const current = sanitize(verdict.assignee?.current);
  switch (verdict.assignee?.action) {
    case "none":
      return check("Assignee", "pass", "Already yours");
    case "skip":
      return check("Assignee", "n-a", current ? `Left with ${current}` : "Left unassigned");
    case "ask":
      return check("Assignee", "warn", `Assigned to ${current}; take over, or start without`);
    case "claim": {
      if (mode === "plan" || !applied) {
        return check(
          "Assignee",
          "n-a",
          current ? `${current}'s, would be taken over` : "Unassigned, would be claimed for you"
        );
      }
      const landed = Boolean(after?.assignee?.accountId) && after?.assignee?.accountId === user?.accountId;
      if (!applied.ok && !landed) {
        return check("Assignee", "stop", sanitize(applied.detail) || "The update failed");
      }
      return check(
        "Assignee",
        "pass",
        current ? `Taken over from ${current}` : "Was unassigned, now yours"
      );
    }
    default:
      return check("Assignee", "n-a", "Not reached");
  }
}
function statusRow(verdict) {
  const { applied, after, mode } = verdict;
  const transition = verdict.transition ?? {};
  const from = sanitize(transition.from) || "unknown";
  switch (transition.action) {
    case "skip":
      return check("Status", "n-a", `Already ${from}`);
    case "unavailable":
      return check("Status", "warn", `No transition into In Progress from ${from}`);
    case "ask":
      return check(
        "Status",
        "warn",
        `${plural(transition.candidates?.length ?? 0, "transition", "transitions")} into In Progress; choose one`
      );
    case "not-advertised":
      return check(
        "Status",
        "warn",
        `"${sanitize(transition.chosen)}" is not a transition into In Progress from ${from}`
      );
    case "stop":
      return check("Status", "stop", `${from}; a claim does not reopen a complete item`);
    case "transition": {
      const to = sanitize(transition.to);
      if (mode === "plan" || !applied) {
        return check("Status", "n-a", `${from} \u2192 ${to}, would be taken`);
      }
      const landed = (after?.status?.name ?? "").toLowerCase() === to.toLowerCase() && to !== "";
      if (!applied.ok && !landed) {
        return check("Status", "stop", sanitize(applied.detail) || "The update failed");
      }
      return check("Status", "pass", `${from} \u2192 ${to}`);
    }
    default:
      return check("Status", "n-a", "Not reached");
  }
}
var FATES = {
  kept: "kept on the branch",
  stashed: "stashed",
  worktree: "left in this tree"
};
function branchNote(plan, tree, after) {
  if (plan.action === "reuse") {
    return "reused";
  }
  if (plan.action === "checkout-existing") {
    return "checked out";
  }
  const base2 = sanitize(plan.base) || sanitize(tree.branch) || "HEAD";
  const elsewhere = after?.path && after.path !== tree.path ? `, in a worktree at ${after.path}` : "";
  return `created off ${base2}${elsewhere}`;
}
function branchRows(branch) {
  if (!branch || !branch.status) {
    return [];
  }
  const reasons = branch.reasons ?? [];
  const detail = reasons.map((reason) => sanitize(reason.detail)).filter(Boolean).join("; ");
  const codes = new Set(reasons.map((reason) => reason.code));
  const { tree, after } = branch;
  const plan = branch.plan ?? {};
  if (!tree) {
    if (branch.status === "fail") {
      return [check("Branch", "stop", detail || "The branch step failed")];
    }
    return after?.branch ? [check("Branch", "pass", sanitize(after.branch))] : [];
  }
  const rows = [
    check(
      "Repo",
      "pass",
      sanitize(tree.remote?.slug) || tree.path.split("/").filter(Boolean).at(-1) || tree.path
    ),
    check("Repo Writable", "pass", sanitize(tree.path))
  ];
  const staged = tree.staged ?? 0;
  const untracked = tree.untracked ?? 0;
  const modified = (tree.unstaged ?? 0) - untracked;
  if (staged + modified + untracked === 0) {
    rows.push(check("Working Tree", "pass", "Clean"));
  } else if (staged + modified === 0) {
    const files = plural(untracked, "untracked file", "untracked files");
    rows.push(
      check("Working Tree", "pass", codes.has("untracked-carried") ? `${files}, carried` : files)
    );
  } else {
    const counts = `${staged} staged, ${modified} unstaged` + (untracked > 0 ? `, ${untracked} untracked` : "");
    const fate = plan.changes ? FATES[plan.changes] : void 0;
    if (codes.has("changes-pending")) {
      rows.push(check("Working Tree", "warn", `${counts}; keep, stash, or use a worktree`));
    } else {
      rows.push(check("Working Tree", "pass", fate ? `${counts}, ${fate}` : counts));
    }
  }
  const name = sanitize(after?.branch) || sanitize(plan.branch) || "unknown";
  if (branch.status === "fail") {
    rows.push(check("Branch", "stop", detail || "The branch step failed"));
  } else if (codes.has("base-needed")) {
    rows.push(check("Branch", "warn", `${name}, awaiting your choice of base`));
  } else if (codes.has("changes-pending")) {
    const verb = plan.action === "create" ? "created" : "checked out";
    rows.push(check("Branch", "warn", `${name}, not yet ${verb}`));
  } else if (!after) {
    rows.push(check("Branch", "pass", `${name}, would be ${branchNote(plan, tree, null)}`));
  } else if (codes.has("base-stale") || codes.has("lfs-checkout-failed")) {
    const caveats = [
      ...codes.has("base-stale") ? [`${plan.base ?? "the base"} not refreshed`] : [],
      ...codes.has("lfs-checkout-failed") ? ["LFS checkout failed"] : []
    ];
    rows.push(
      check("Branch", "warn", `${name}, ${branchNote(plan, tree, after)}; ${caveats.join("; ")}`)
    );
  } else {
    rows.push(check("Branch", "pass", `${name}, ${branchNote(plan, tree, after)}`));
  }
  return rows;
}
function claimRows(verdict) {
  if (!verdict || typeof verdict !== "object" || Array.isArray(verdict)) {
    throw new TypeError("Expected a claim verdict");
  }
  if (!verdict.item?.key) {
    throw new TypeError("Expected a claim verdict carrying its item");
  }
  return [
    workItemRow(claimedItem(verdict)),
    criteriaRow(verdict.criteria),
    assigneeRow(verdict),
    statusRow(verdict),
    ...branchRows(verdict.branch)
  ];
}
function claimTable(verdict, widths = tableWidths()) {
  return fencedTable({ rows: claimRows(verdict) }, widths);
}

// ../../plugins/jira/src/storage/user.ts
var currentUserCodec = {
  version: 1,
  encode: (value) => ({ accountId: value.accountId, displayName: value.displayName }),
  decode: (value) => {
    if (!isJsonObject(value)) return void 0;
    const accountId = stringProperty(value, "accountId");
    if (accountId === void 0) return void 0;
    const displayName = value.displayName === null ? null : stringProperty(value, "displayName");
    if (value.displayName !== void 0 && value.displayName !== null && displayName === void 0) {
      return void 0;
    }
    return { accountId, displayName: displayName ?? null };
  }
};
var currentUserKey = defineStorageKey(
  "jira/current-user",
  currentUserCodec
);
function getCurrentUser(store) {
  return store.get(currentUserKey);
}
function setCurrentUser(store, value) {
  return store.set(currentUserKey, value);
}

// ../../plugins/jira/src/work-item/claim.ts
var CLAIM_WORK_ITEM_SCHEMA = "jira-workflows/claim-work-item/v1";
var TARGET_STATUS = "In Progress";
var CATEGORY_NEW = "new";
var CATEGORY_IN_PROGRESS = "indeterminate";
var CATEGORY_DONE2 = "done";
var DECISION_CODES = /* @__PURE__ */ new Set([
  "assignee-takeover",
  "transition-ambiguous",
  "status-not-advertised"
]);
var lower2 = (value) => String(value ?? "").trim().toLowerCase();
function checkArguments5(options) {
  const key = issueKeyArgument(options.key);
  if (options.takeOver && options.skipAssignee) {
    throw new UsageError("--take-over and --skip-assignee exclude each other");
  }
  for (const field of options.fields ?? []) {
    if (!field.includes("=")) {
      throw new UsageError(`--field needs a <key>=<value>: ${field}`);
    }
  }
  return key;
}
function planAssignee(current, user) {
  if (current === null) {
    return { action: "claim", current: null };
  }
  if (current.accountId !== void 0 && current.accountId === user.accountId) {
    return { action: "none", current: current.displayName };
  }
  return { action: "ask", current: current.displayName };
}
function resolveAssignee(planned, {
  takeOver = false,
  skipAssignee = false
} = {}) {
  if (planned.action === "none") return planned;
  if (skipAssignee) return { ...planned, action: "skip" };
  if (planned.action === "ask" && takeOver) return { ...planned, action: "claim" };
  return planned;
}
function chooseTransition2(transitions, chosen) {
  const categorised = transitions.some((t) => t.category !== null && t.category !== void 0);
  const inProgressKeyed = categorised ? transitions.filter((t) => t.category === CATEGORY_IN_PROGRESS) : transitions.filter((t) => lower2(t.to) === lower2(TARGET_STATUS));
  const summary = (t) => ({
    id: t.id,
    name: t.name,
    to: t.to
  });
  if (chosen !== void 0) {
    const picked = inProgressKeyed.find(
      (t) => lower2(t.to) === lower2(chosen) || lower2(t.name) === lower2(chosen)
    );
    if (picked) {
      return {
        action: "transition",
        from: null,
        ...summary(picked),
        candidates: inProgressKeyed.map(summary)
      };
    }
    return {
      action: "not-advertised",
      from: null,
      chosen,
      candidates: inProgressKeyed.map(summary)
    };
  }
  const named = inProgressKeyed.find((t) => lower2(t.to) === lower2(TARGET_STATUS));
  if (named) {
    return {
      action: "transition",
      from: null,
      ...summary(named),
      candidates: inProgressKeyed.map(summary)
    };
  }
  if (inProgressKeyed.length === 1) {
    return {
      action: "transition",
      from: null,
      ...summary(inProgressKeyed[0]),
      candidates: inProgressKeyed.map(summary)
    };
  }
  if (inProgressKeyed.length > 1) {
    return { action: "ask", from: null, candidates: inProgressKeyed.map(summary) };
  }
  return { action: "unavailable", from: null, candidates: transitions.map(summary) };
}
function decodeTransition(value) {
  if (!isJsonObject(value)) return void 0;
  const id = typeof value.id === "string" ? value.id : typeof value.id === "number" ? String(value.id) : void 0;
  const to = isJsonObject(value.to) ? value.to : void 0;
  const status = isJsonObject(value.status) ? value.status : void 0;
  const toName = to && typeof to.name === "string" ? to.name : void 0;
  const flatToName = typeof value.toName === "string" ? value.toName : void 0;
  const statusName = status && typeof status.name === "string" ? status.name : void 0;
  const actionName = typeof value.name === "string" ? value.name : void 0;
  const targetName = toName ?? flatToName ?? statusName ?? actionName;
  if (id === void 0 || targetName === void 0) return void 0;
  const categoryOf = (holder) => {
    const category = holder?.statusCategory;
    return category !== void 0 && isJsonObject(category) && typeof category.key === "string" ? category.key : null;
  };
  return {
    id,
    name: actionName ?? targetName,
    to: targetName,
    category: categoryOf(to) ?? categoryOf(status) ?? categoryKey(value.category)
  };
}
var CATEGORY_KEYS = {
  "to do": CATEGORY_NEW,
  [CATEGORY_NEW]: CATEGORY_NEW,
  "in progress": CATEGORY_IN_PROGRESS,
  [CATEGORY_IN_PROGRESS]: CATEGORY_IN_PROGRESS,
  done: CATEGORY_DONE2
};
function categoryKey(value) {
  return typeof value === "string" ? CATEGORY_KEYS[lower2(value)] ?? null : null;
}
function extractTransitions(payload) {
  const raw = extractArrayPayload(payload, ["transitions"]) ?? [];
  return raw.flatMap((item) => {
    const decoded = decodeTransition(item);
    return decoded === void 0 ? [] : [decoded];
  });
}
function planTransition2(status, discover, chosen) {
  const { category, name: from } = status;
  if (category === CATEGORY_DONE2) {
    return { action: "stop", from, reason: "The item is complete" };
  }
  if (category === CATEGORY_IN_PROGRESS) {
    return { action: "skip", from, reason: "Already in progress" };
  }
  if (category !== null && category !== CATEGORY_NEW) {
    return { action: "stop", from, reason: `Unrecognised status category "${category}"` };
  }
  const result = discover();
  if (!result.ok) {
    return { action: "unavailable", from, reason: result.detail, candidates: [] };
  }
  return { ...chooseTransition2(extractTransitions(result.payload), chosen), from };
}
function buildCommand2(key, site, assignee, transition, fields = []) {
  const args = ["jira", "workitem", "update", "--id", key];
  if (assignee.action === "claim") args.push("--assignee", "me");
  if (transition.action === "transition" && transition.to !== void 0)
    args.push("--status", transition.to);
  if (args.length === 5) return void 0;
  for (const field of fields) args.push("--field", field);
  const displayed = site ? [...args, "--site", site] : args;
  const shown = displayed.map((a) => /[\s"]/.test(a) ? JSON.stringify(a) : a).join(" ");
  return { args, display: `twg ${shown}` };
}
var CRITERIA_HEADING_RE = /^##\s+(?:acceptance\s+criteria|done\s+when)\s*$/i;
var LEVEL_TWO_HEADING_RE = /^##\s/;
var TOP_LEVEL_LIST_ITEM_RE = /^(?:[-*+]|\d+[.)])\s+\S/;
function countCriteria(description) {
  if (typeof description !== "string") return null;
  let inSection = false;
  let found = false;
  let count2 = 0;
  for (const line of description.split(/\r?\n/)) {
    if (CRITERIA_HEADING_RE.test(line)) {
      if (found) break;
      found = true;
      inSection = true;
    } else if (LEVEL_TWO_HEADING_RE.test(line)) {
      inSection = false;
    } else if (inSection && TOP_LEVEL_LIST_ITEM_RE.test(line)) {
      count2 += 1;
    }
  }
  return found ? { count: count2 } : null;
}
function readRaw(runner, binary, key, fields, site) {
  const result = runner(
    binary,
    ["jira", "workitem", "get", key, "--fields", fields],
    site !== void 0 ? { site } : {}
  );
  if (!result.ok || result.payload === void 0) return void 0;
  const unwrapped = unwrapWorkItemEnvelope(result.payload);
  if (unwrapped === void 0) return void 0;
  const record = hoistFields(unwrapped);
  const rawAssignee = record.assignee;
  const assignee = rawAssignee === null ? null : isJsonObject(rawAssignee) ? {
    accountId: typeof rawAssignee.accountId === "string" ? rawAssignee.accountId : void 0,
    displayName: typeof rawAssignee.displayName === "string" ? rawAssignee.displayName : null
  } : void 0;
  const rawStatus = record.status;
  const status = isJsonObject(rawStatus) ? {
    name: typeof rawStatus.name === "string" ? rawStatus.name : null,
    category: isJsonObject(rawStatus.statusCategory) && typeof rawStatus.statusCategory.key === "string" ? rawStatus.statusCategory.key : null
  } : void 0;
  return { assignee, status };
}
function decodeCurrentUser(result) {
  if (!result.ok || result.payload === void 0 || !isJsonObject(result.payload)) return void 0;
  const data = result.payload.data;
  const record = isJsonObject(data) && isJsonObject(data.user) ? data.user : data;
  if (!isJsonObject(record)) return void 0;
  const accountId = typeof record.accountId === "string" ? record.accountId : void 0;
  if (accountId === void 0) return void 0;
  const displayName = typeof record.name === "string" ? record.name : typeof record.displayName === "string" ? record.displayName : null;
  return { accountId, displayName };
}
async function currentUser(runner, binary, memory) {
  const cached = await getCurrentUser(memory.plugin);
  if (cached !== void 0) return cached;
  const user = decodeCurrentUser(runner(binary, ["user", "get"]));
  if (user?.accountId !== void 0) {
    await setCurrentUser(memory.plugin, {
      accountId: user.accountId,
      displayName: user.displayName
    });
  }
  return user;
}
function emptyExtra2(key, site, mode) {
  return {
    key,
    site,
    mode,
    item: null,
    criteria: null,
    user: null,
    assignee: null,
    transition: null,
    command: null,
    applied: null,
    after: null
  };
}
function mapFetchError(key, siteOption, mode, error) {
  if (!(error instanceof FetchWorkItemError)) throw error;
  const common = emptyExtra2(key, siteOption ?? null, mode);
  if (error.code === "wrong-site" || error.code === "cloud-id-unresolved") {
    return fail(CLAIM_WORK_ITEM_SCHEMA, [{ code: "site-unresolved", detail: error.message }], {
      ...common,
      sites: error.sites
    });
  }
  return fail(
    CLAIM_WORK_ITEM_SCHEMA,
    [{ code: error.code, detail: error.message }],
    common
  );
}
async function claim(input) {
  const key = checkArguments5(input);
  const options = {
    ...input,
    site: input.site ?? await resolveIndexedSite(input.memory, key)
  };
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const planOnly = options.planOnly ?? false;
  const mode = planOnly ? "plan" : "apply";
  const fields = options.fields ?? [];
  let binary;
  try {
    binary = resolveTwgBinary(env);
  } catch (error) {
    if (error instanceof TwgNotFoundError) {
      return fail(
        CLAIM_WORK_ITEM_SCHEMA,
        [{ code: "twg-not-found", detail: error.message }],
        emptyExtra2(key, options.site ?? null, mode)
      );
    }
    throw error;
  }
  let fetched;
  try {
    fetched = await fetchWorkItem({
      key,
      site: options.site,
      scope: "session",
      linkSource: "claim",
      memory: options.memory,
      runner,
      env
    });
  } catch (error) {
    return mapFetchError(key, options.site, mode, error);
  }
  const user = await currentUser(runner, binary, options.memory);
  if (user === void 0) {
    return fail(
      CLAIM_WORK_ITEM_SCHEMA,
      [{ code: "user-unresolved", detail: "twg user get returned no accountId" }],
      emptyExtra2(key, options.site ?? null, mode)
    );
  }
  const effectiveSite = options.site ?? (typeof fetched.site === "string" ? fetched.site : null);
  const rawAssignee = readRaw(runner, binary, key, "assignee", options.site)?.assignee;
  const current = fetched.assignee === null || fetched.assignee === void 0 ? null : rawAssignee === void 0 ? { accountId: void 0, displayName: fetched.assignee.displayName } : rawAssignee;
  const assignee = resolveAssignee(planAssignee(current, user), {
    takeOver: options.takeOver,
    skipAssignee: options.skipAssignee
  });
  const transition = planTransition2(
    { name: fetched.status?.name ?? null, category: fetched.status?.statusCategory?.key ?? null },
    () => runner(
      binary,
      ["jira", "workitem", "transition", "--id", key],
      options.site !== void 0 ? { site: options.site } : {}
    ),
    options.status
  );
  const item = {
    key: fetched.key,
    summary: fetched.summary ?? null,
    url: typeof fetched.site === "string" ? browseUrl(fetched.site, fetched.key) : null,
    type: fetched.issuetype?.name ?? null,
    priority: fetched.priority?.name ?? null,
    parent: fetched.parent?.key ?? null,
    status: {
      name: fetched.status?.name ?? null,
      category: fetched.status?.statusCategory?.key ?? null
    },
    assignee: current
  };
  const command = buildCommand2(key, options.site, assignee, transition, fields);
  const common = {
    key,
    site: effectiveSite,
    mode,
    item,
    criteria: countCriteria(fetched.description),
    user,
    assignee,
    transition,
    command: command?.display ?? null,
    applied: null,
    after: null
  };
  if (transition.action === "stop") {
    return fail(
      CLAIM_WORK_ITEM_SCHEMA,
      [
        {
          code: "item-complete",
          detail: `${key} is ${transition.from}; a claim does not reopen a complete item`
        }
      ],
      {
        ...common,
        command: null
      }
    );
  }
  const decisions = [];
  if (assignee.action === "ask") {
    decisions.push({
      code: "assignee-takeover",
      detail: `${key} is assigned to ${assignee.current}; re-run with --take-over or --skip-assignee`
    });
  }
  if (transition.action === "ask") {
    decisions.push({
      code: "transition-ambiguous",
      detail: `${key} has ${transition.candidates?.length ?? 0} transitions into In Progress; re-run with --status <name>`
    });
  }
  if (transition.action === "not-advertised") {
    decisions.push({
      code: "status-not-advertised",
      detail: `"${transition.chosen}" is not a transition into In Progress from ${transition.from}`
    });
  }
  if (decisions.length > 0) {
    return warn(CLAIM_WORK_ITEM_SCHEMA, decisions, common);
  }
  const reasons = [];
  if (transition.action === "unavailable") {
    reasons.push({
      code: "transition-unavailable",
      detail: transition.reason ?? `${key} has no transition into In Progress from ${transition.from}`
    });
  }
  if (assignee.action === "none" && transition.action === "skip") {
    reasons.push({
      code: "already-claimed",
      detail: `${key} is already yours and already ${transition.from}`
    });
  }
  if (assignee.action === "skip" && transition.action === "skip") {
    reasons.push({
      code: "nothing-to-do",
      detail: `${key} is already ${transition.from} and the assignee was left alone`
    });
  }
  if (!command || planOnly) {
    if (reasons.some((r) => r.code === "transition-unavailable")) {
      return warn(CLAIM_WORK_ITEM_SCHEMA, reasons, common);
    }
    return pass(CLAIM_WORK_ITEM_SCHEMA, common, { reasons });
  }
  const written = runner(
    binary,
    command.args,
    options.site !== void 0 ? { site: options.site } : {}
  );
  const applied = {
    ok: written.ok,
    ...written.ok ? {} : { detail: written.detail }
  };
  const readBack = readRaw(runner, binary, key, "assignee,status", options.site);
  const after = readBack ? { assignee: readBack.assignee ?? null, status: readBack.status ?? null } : null;
  if (after !== null) {
    await refreshClaimCache(options.memory, fetched, after);
  }
  if (!written.ok) {
    return fail(
      CLAIM_WORK_ITEM_SCHEMA,
      [...reasons, { code: "write-failed", detail: written.detail ?? "twg exited non-zero" }],
      {
        ...common,
        applied,
        after
      }
    );
  }
  const landed = after !== null && (assignee.action !== "claim" || after.assignee?.accountId === user.accountId) && (transition.action !== "transition" || lower2(after.status?.name) === lower2(transition.to));
  if (after !== null && !landed) {
    reasons.push({
      code: "read-back-mismatch",
      detail: `The update returned ok but ${key} reads back as ${after.status?.name ?? "unknown"}, assigned to ${after.assignee?.displayName ?? "nobody"}`
    });
  }
  if (reasons.some((r) => r.code === "transition-unavailable" || r.code === "read-back-mismatch")) {
    return warn(CLAIM_WORK_ITEM_SCHEMA, reasons, { ...common, applied, after });
  }
  return pass(CLAIM_WORK_ITEM_SCHEMA, { ...common, applied, after }, { reasons });
}
async function refreshClaimCache(memory, fetched, after) {
  try {
    const status = after.status;
    await memory.patchWorkItem("session", {
      cloudId: fetched.cloudId,
      key: fetched.key,
      assignee: after.assignee === null ? null : { displayName: after.assignee.displayName ?? fetched.assignee?.displayName ?? "" },
      // `patchWorkItem` replaces `status` whole, not field by field, so a
      // read-back that answered no category must still carry the item's
      // existing one forward rather than dropping it from the cache.
      ...status !== null ? {
        status: {
          name: status.name ?? fetched.status.name,
          ...status.category !== null ? { statusCategory: { key: status.category } } : fetched.status.statusCategory !== void 0 ? { statusCategory: fetched.status.statusCategory } : {}
        }
      } : {}
    });
  } catch {
  }
}
async function withBranch(result, options) {
  const path8 = options.path ?? process.cwd();
  const git = options.git ?? runGit;
  const preparer = options.preparer ?? prepareBranch;
  const key = asIssueKey(options.key);
  const root = topLevel(path8, git);
  if (root === null) {
    return {
      ...result,
      branch: { action: "skipped", detail: `${path8} is not inside a git working tree` }
    };
  }
  const branch = currentBranch(root, git);
  const named = defaultBranch(root, git);
  if (branch === null || named === null || branch !== named) {
    return {
      ...result,
      branch: {
        action: "skipped",
        branch: branch ?? null,
        defaultBranch: named,
        carriesKey: carriesKey(branch ?? "", key),
        detail: `${root} is on ${branch ?? "a detached HEAD"}, not ${named ?? "a default branch it can name"}`
      }
    };
  }
  const item = result.item;
  const branchVerdict = await preparer({
    key,
    path: root,
    site: result.site ?? options.site,
    planOnly: options.planOnly ?? false,
    fetch: options.fetch,
    // The plugin scope holds the repository's fetch preference; the item is
    // given, so nothing is read into the session scope here.
    memory: options.memory,
    ...item ? {
      item: {
        key: item.key,
        summary: item.summary,
        site: result.site ?? options.site ?? void 0
      }
    } : {},
    git,
    env: options.env
  });
  let next = { ...result, branch: branchVerdict };
  if (branchVerdict.status === "fail") {
    const detail = branchVerdict.reasons.map((r) => r.detail).filter(Boolean).join("; ") || "prepare-branch failed";
    next = withReason(next, { code: "branch-failed", detail }, "warn");
  } else if (branchVerdict.status === "warn" && branchVerdict.reasons.some((r) => r.code === "base-needed" || r.code === "changes-pending")) {
    const detail = branchVerdict.reasons.map((r) => r.detail).filter(Boolean).join("; ");
    next = withReason(next, { code: "branch-pending", detail }, "warn");
  }
  return next;
}
async function claimAndBranch(options) {
  const result = await claim(options);
  if (!options.prepareBranch) return result;
  if (result.status === "fail" || result.reasons.some((r) => DECISION_CODES.has(r.code))) {
    return { ...result, branch: { action: "skipped", detail: "The claim did not land" } };
  }
  return withBranch(result, options);
}
function withPanels(result) {
  const { item } = result;
  if (item === null) return { ...result, panels: "" };
  return { ...result, panels: claimTable({ ...result, item }) };
}
async function claimWorkItem(options) {
  return withPanels(await claimAndBranch(options));
}

// ../../plugins/jira/src/work-item/transition.ts
var TransitionWorkItemError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "TransitionWorkItemError";
    this.code = code;
  }
};
var MIN_TRANSITION_TIMEOUT_MS2 = 18e4;
async function transitionWorkItem(options) {
  try {
    return await transitionWorkItemUnchecked(options);
  } catch (error) {
    if (error instanceof TwgNotFoundError) {
      throw twgNotFound2(error.message);
    }
    throw error;
  }
}
async function transitionWorkItemUnchecked(options) {
  const { scope, to, memory } = options;
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const issueKey = asIssueKey(options.key);
  const binary = resolveTwgBinary(env);
  const indexed = await resolveCloudSite({ key: issueKey, site: options.site, memory });
  const cloudId = indexed.cloudId;
  const site = options.site ?? indexed.tenantName;
  const record = await memory.getWorkItem(scope, cloudId, issueKey) ?? await selfHealFetch();
  async function selfHealFetch() {
    try {
      return await fetchWorkItem({ key: issueKey, site, scope, memory, runner, env });
    } catch (error) {
      if (!(error instanceof FetchWorkItemError)) throw error;
      if (error.code === "not-authenticated") throw notAuthenticated3(error.message);
      throw new TransitionWorkItemError(
        "fetch-failed",
        `Fetching ${issueKey} to confirm its current status failed: ${error.message} Nothing was written.`
      );
    }
  }
  const discovery = runner(binary, ["jira", "workitem", "transition", "--id", issueKey], { site });
  if (!discovery.ok) {
    if (isAuthFailure2(discovery.detail)) {
      throw notAuthenticated3(discovery.detail);
    }
    throw new TransitionWorkItemError(
      "discovery-failed",
      `Discovering transitions for ${issueKey} failed: ${discovery.detail ?? "twg exited non-zero"}. Nothing was written.`
    );
  }
  const needle = to.toLowerCase();
  const candidates = extractTransitionCandidates(discovery.payload);
  const matches = candidates.filter((candidate) => candidate.name.toLowerCase().includes(needle));
  if (matches.length !== 1) {
    throw new TransitionWorkItemError(
      matches.length === 0 ? "no-match" : "ambiguous-match",
      `${matches.length === 0 ? "No transition" : "More than one transition"} on ${issueKey} matches "${to}". ${listCandidates4(candidates)} Nothing was written.`
    );
  }
  const match = matches[0];
  const write = runner(
    binary,
    ["jira", "workitem", "transition", "--id", issueKey, "--transition-id", match.id],
    { site, timeoutMs: MIN_TRANSITION_TIMEOUT_MS2 }
  );
  if (!write.ok) {
    if (isAuthFailure2(write.detail)) {
      throw notAuthenticated3(write.detail);
    }
    throw new TransitionWorkItemError(
      "transition-failed",
      `Transitioning ${issueKey} to "${match.name}" failed: ${write.detail ?? "twg exited non-zero"}. Nothing was written.`
    );
  }
  const statusCategory = match.category !== void 0 ? { key: match.category } : record.status.statusCategory;
  try {
    await memory.patchWorkItem(scope, {
      cloudId,
      key: issueKey,
      status: {
        name: match.name,
        ...statusCategory !== void 0 ? { statusCategory } : {}
      }
    });
  } catch (error) {
    console.error(
      `${issueKey} was transitioned to "${match.name}", but the stored record could not be updated: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return { assigned: false, transition: { from: record.status.name, to: match.name } };
}
function extractTransitionCandidates(payload) {
  const raw = extractArrayPayload(payload, ["transitions"]) ?? [];
  return raw.flatMap((item) => {
    const candidate = decodeTransitionCandidate(item);
    return candidate === void 0 ? [] : [candidate];
  });
}
function decodeTransitionCandidate(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const id = typeof value.id === "string" ? value.id : typeof value.id === "number" ? String(value.id) : void 0;
  const name = targetStatusName(value);
  if (id === void 0 || name === void 0) return void 0;
  const category = targetStatusCategory(value);
  return category === void 0 ? { id, name } : { id, name, category };
}
function targetStatusCategory(value) {
  const to = value.to;
  if (!isJsonObject(to) || !isJsonObject(to.statusCategory)) return void 0;
  const key = to.statusCategory.key;
  return typeof key === "string" && key.length > 0 ? key : void 0;
}
function targetStatusName(value) {
  const to = value.to;
  if (isJsonObject(to) && typeof to.name === "string") {
    return to.name;
  }
  const status = value.status;
  if (isJsonObject(status) && typeof status.name === "string") {
    return status.name;
  }
  return typeof value.name === "string" ? value.name : void 0;
}
function listCandidates4(candidates) {
  if (candidates.length === 0) {
    return "twg reported no available transitions.";
  }
  const lines = candidates.map((candidate) => `  - ${candidate.name}`).join("\n");
  return `Candidate transitions:
${lines}`;
}
function twgNotFound2(where) {
  return new TransitionWorkItemError("twg-not-found", twgNotFoundDetail(where, "written"));
}
function notAuthenticated3(detail) {
  return new TransitionWorkItemError(
    "not-authenticated",
    notAuthenticatedDetail(detail, "written")
  );
}
function isAuthFailure2(detail) {
  const text6 = String(detail ?? "").toLowerCase();
  return text6.includes("auth") || text6.includes("401") || text6.includes("log in") || text6.includes("login") || text6.includes("expired") || text6.includes("revoked");
}

// ../../plugins/jira/src/work-item/draft-validate.ts
var DRAFT_VERDICT_SCHEMA = "jira-workflows/draft-verdict/v2";
var TITLE_LIMIT = 255;
var TITLE_WARN_LIMIT = 80;
var FIELD_CHECKS = [
  "fields-invalid",
  "field-unknown",
  "field-missing",
  "field-type",
  "field-length"
];
var ISSUE_KEY_PREFIX = /^\[?[A-Za-z][A-Za-z0-9_]*-\d+\]?\s*[:–—-]?\s+/;
var BRACKETED_PREFIX = /^\[[^\]]+\]\s*/;
var PROJECT_KEY_PREFIX = /^[A-Z][A-Z0-9_]{1,9}\s*:\s+/;
function isVerbLed(title) {
  const first = String(title ?? "").trim().split(/\s+/)[0]?.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z]+$/, "").toLowerCase();
  if (!first) return false;
  const nonVerbStarters = /* @__PURE__ */ new Set([
    "a",
    "all",
    "an",
    "another",
    "any",
    "every",
    "i",
    "it",
    "its",
    "no",
    "not",
    "our",
    "some",
    "that",
    "the",
    "there",
    "these",
    "this",
    "those",
    "we"
  ]);
  if (nonVerbStarters.has(first)) return false;
  const nounSuffixes = ["ing", "ion", "ment", "ness", "ance", "ence", "ity", "ship"];
  return !nounSuffixes.some((suffix) => first.endsWith(suffix) && first.length > suffix.length + 2);
}
var RULES = [
  {
    code: "title-too-long",
    severity: "fail",
    check: (title) => title.length > TITLE_LIMIT ? `Title is ${title.length} characters. Jira rejects a summary over ${TITLE_LIMIT}.` : void 0
  },
  {
    code: "title-has-key-prefix",
    severity: "fail",
    check: (title) => {
      for (const pattern of [ISSUE_KEY_PREFIX, BRACKETED_PREFIX, PROJECT_KEY_PREFIX]) {
        const match = pattern.exec(title);
        if (match) {
          return `Title opens with the project or epic prefix "${match[0].trim()}". Jira shows the key beside the summary already.`;
        }
      }
      return void 0;
    }
  },
  {
    code: "title-over-80",
    severity: "warn",
    check: (title) => title.length > TITLE_WARN_LIMIT ? `Title is ${title.length} characters, over the ${TITLE_WARN_LIMIT}-character readability target.` : void 0
  },
  {
    code: "title-not-verb-led",
    severity: "warn",
    check: (title) => isVerbLed(title) ? void 0 : "Title does not read as verb-led and activity-phrased. Open with what the item does."
  }
];
function parseFields(text6) {
  try {
    return { value: JSON.parse(text6) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
function compose(input, path8) {
  let resolved;
  try {
    resolved = resolveTemplate("work-item", input.name, path8);
  } catch (error) {
    const reason = templateErrorReason(error);
    if (reason === void 0) throw error;
    return {
      reasons: [{ ...reason, status: "fail" }],
      template: null,
      description: "",
      checks: []
    };
  }
  const template = {
    name: resolved.template.name,
    source: resolved.source,
    path: resolved.path
  };
  const parsed = parseFields(input.fields);
  if ("error" in parsed) {
    const detail = `The fields are not valid JSON: ${parsed.error}`;
    return {
      reasons: [{ code: "fields-invalid", detail, status: "fail" }],
      template,
      description: "",
      checks: FIELD_CHECKS
    };
  }
  const reasons = verifyFields(resolved.template, parsed.value);
  return {
    reasons,
    template,
    // A value that is not an object has nothing to render; the reason says why.
    description: isObject(parsed.value) ? renderDocument(resolved.template, parsed.value) : "",
    checks: FIELD_CHECKS
  };
}
function validateDraft(options) {
  const title = String(options.title ?? "").trim();
  if (!title) {
    throw new UsageError("--title is required");
  }
  const reasons = [];
  for (const rule of RULES) {
    const detail = rule.check(title);
    if (detail) reasons.push({ code: rule.code, detail, status: rule.severity });
  }
  const { input } = options;
  const composed = input.kind === "raw" ? { reasons: [], template: null, description: input.description, checks: [] } : compose(input, options.path);
  const extra = {
    rulesChecked: [...RULES.map((rule) => rule.code), ...composed.checks],
    template: composed.template,
    source: input.kind === "raw" ? "raw" : composed.template?.source ?? null,
    description: composed.description
  };
  const found = [...reasons, ...composed.reasons];
  const all = found.map(
    (reason) => Object.fromEntries(Object.entries(reason).filter(([key]) => key !== "status"))
  );
  const status = worst(found.map((reason) => reason.status));
  if (status === "fail") return fail(DRAFT_VERDICT_SCHEMA, all, extra);
  if (status === "warn") return warn(DRAFT_VERDICT_SCHEMA, all, extra);
  return pass(DRAFT_VERDICT_SCHEMA, extra);
}

// ../../plugins/jira/src/work-item/link.ts
var LINK_VERDICT_SCHEMA = "jira-workflows/link-verdict/v1";
function normalizePhrase(phrase) {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}
function matchPhrase(normalised, types) {
  const matches = [];
  for (const type of types) {
    const inward = normalizePhrase(type.inward);
    const outward = normalizePhrase(type.outward);
    if (outward === normalised) {
      matches.push({ type, matchedAs: "outward" });
    } else if (inward === normalised && inward !== outward) {
      matches.push({ type, matchedAs: "inward" });
    }
  }
  return matches;
}
function resolveEndpoints(from, to, matchedAs) {
  return matchedAs === "inward" ? { id: to, targetId: from } : { id: from, targetId: to };
}
function linkSlotFor(link2, otherKey) {
  if (link2?.outwardIssue?.key === otherKey) {
    return "outward";
  }
  if (link2?.inwardIssue?.key === otherKey) {
    return "inward";
  }
  return void 0;
}
function matchRelationship(relationship, siteTypes, linkType) {
  if (siteTypes.length === 0) {
    return {
      status: "fail",
      reasons: [
        {
          code: "no-link-types",
          detail: "The site returned no link types. Check site access and permissions."
        }
      ]
    };
  }
  const wanted = linkType === void 0 ? void 0 : normalizePhrase(linkType);
  const types = wanted === void 0 ? siteTypes : siteTypes.filter(
    (type) => type.id === linkType?.trim() || normalizePhrase(type.name) === wanted
  );
  if (types.length === 0) {
    return {
      status: "fail",
      reasons: [
        {
          code: "link-type-unresolved",
          detail: `No link type on this site has the id or name "${linkType}". Available types: ${siteTypes.map((type) => type.name).join(", ")}.`
        }
      ]
    };
  }
  const matches = matchPhrase(normalizePhrase(relationship), types);
  if (matches.length === 0) {
    const available = types.flatMap(
      (type) => type.inward === type.outward ? [type.inward] : [type.inward, type.outward]
    ).join(", ");
    const scope = wanted === void 0 ? "No link type on this site has" : `The link type ${types.map((type) => `"${type.name}"`).join(", ")} has no`;
    return {
      status: "fail",
      reasons: [
        {
          code: "relationship-unresolved",
          detail: `${scope} an inward or outward label matching "${relationship}". Available phrases: ${available}.`
        }
      ]
    };
  }
  if (matches.length > 1) {
    const names = matches.map((match) => `"${match.type.name}" (matched as ${match.matchedAs})`).join(", ");
    return {
      status: "fail",
      reasons: [
        {
          code: "relationship-ambiguous",
          detail: `"${relationship}" matches more than one link type: ${names}. Re-run with --link-type <name> to choose one.`
        }
      ]
    };
  }
  return { status: "pass", match: matches[0] };
}
function linkFromMatch(from, to, match) {
  const { id, targetId } = resolveEndpoints(from, to, match.matchedAs);
  return {
    id,
    targetId,
    linkTypeId: match.type.id,
    outward: match.type.outward,
    inward: match.type.inward
  };
}
function matchOutcomeToVerdict(outcome, from, to) {
  if (outcome.status === "fail") {
    return fail(LINK_VERDICT_SCHEMA, outcome.reasons, { link: null });
  }
  return pass(LINK_VERDICT_SCHEMA, { link: linkFromMatch(from, to, outcome.match) });
}
function assessLinkVerification(input) {
  const { from, to, match, links } = input;
  const { type, matchedAs: expectedSlot } = match;
  const symmetric = normalizePhrase(type.inward) === normalizePhrase(type.outward);
  const link2 = links.find(
    (candidate) => (candidate.type?.id === type.id || candidate.type?.name === type.name) && (candidate.outwardIssue?.key === to || candidate.inwardIssue?.key === to)
  );
  if (link2 === void 0) {
    return failVerdict(
      "link-not-found",
      `No "${type.name}" link from ${from} to ${to} was found. The write may have failed or targeted the wrong items.`
    );
  }
  const actualSlot = linkSlotFor(link2, to);
  if (!symmetric && actualSlot !== expectedSlot) {
    const wantPhrase = expectedSlot === "outward" ? type.outward : type.inward;
    const gotPhrase = actualSlot === "outward" ? type.outward : type.inward;
    return failVerdict(
      "direction-reversed",
      `Link is reversed: expected "${from} ${wantPhrase} ${to}" but Jira stored "${from} ${gotPhrase} ${to}". Delete the link and re-create it with --id and --target-id swapped.`
    );
  }
  return pass(LINK_VERDICT_SCHEMA, { link: linkFromMatch(from, to, match) });
}
function failVerdict(code, detail) {
  return fail(LINK_VERDICT_SCHEMA, [{ code, detail }], { link: null });
}
function toLinkType(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const id = stringProperty(value, "id");
  const name = stringProperty(value, "name");
  const inward = stringProperty(value, "inward");
  const outward = stringProperty(value, "outward");
  return id !== void 0 && name !== void 0 && inward !== void 0 && outward !== void 0 ? { id, name, inward, outward } : void 0;
}
function toIssueRef(value) {
  return value !== void 0 && isJsonObject(value) ? { key: stringProperty(value, "key") } : void 0;
}
function toLinkRecord(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const id = stringProperty(value, "id");
  const type = isJsonObject(value.type) ? { id: stringProperty(value.type, "id"), name: stringProperty(value.type, "name") } : void 0;
  const outwardIssue = toIssueRef(value.outwardIssue);
  const inwardIssue = toIssueRef(value.inwardIssue);
  return { id, type, outwardIssue, inwardIssue };
}
async function linkWorkItem(options) {
  const { key: from, target: to, relationship, linkType, site, dryRun = false } = options;
  const env = options.env ?? process.env;
  const runner = options.runner ?? runTwgJson;
  const binary = resolveTwgBinary(env);
  const typesResult = runner(binary, ["jira", "workitem", "link-types", "query"], { site });
  if (!typesResult.ok) {
    return failVerdict(
      "link-types-unavailable",
      typesResult.detail ?? "twg jira workitem link-types query failed."
    );
  }
  const types = (extractArrayPayload(typesResult.payload) ?? []).map(toLinkType).filter((type) => type !== void 0);
  const outcome = matchRelationship(relationship, types, linkType);
  if (outcome.status === "fail" || dryRun) {
    return matchOutcomeToVerdict(outcome, from, to);
  }
  const link2 = linkFromMatch(from, to, outcome.match);
  const write = runner(
    binary,
    [
      "jira",
      "workitem",
      "link",
      "workitem",
      "--id",
      link2.id,
      "--target-id",
      link2.targetId,
      "--link-type-id",
      link2.linkTypeId
    ],
    { site }
  );
  if (!write.ok) {
    return failVerdict(
      "link-write-failed",
      write.detail ?? "twg jira workitem link workitem failed."
    );
  }
  const readBack = runner(binary, ["jira", "workitem", "link", "query", "--issue-id", from], {
    site
  });
  if (!readBack.ok) {
    return failVerdict(
      "link-query-failed",
      readBack.detail ?? "twg jira workitem link query failed."
    );
  }
  const links = (extractArrayPayload(readBack.payload) ?? []).map(toLinkRecord).filter((record) => record !== void 0);
  return assessLinkVerification({ from, to, match: outcome.match, links });
}

// ../../plugins/jira/src/work-item/render.ts
function renderStoredWorkItem(record, options = {}) {
  const panel = workItemPanel(record, record.description);
  if (options.comments !== true) {
    return panel;
  }
  return `${panel}
${commentsMarkdown(commentsOf2(record))}`;
}
function commentsOf2(record) {
  if (Array.isArray(record.comments) && record.comments.length > 0) {
    return record.comments;
  }
  return record.comment?.comments ?? [];
}
function commentsMarkdown(thread) {
  const blocks = thread.length === 0 ? ["_none_"] : thread.map(commentBlock);
  return `## Comments

${blocks.join("\n\n")}
`;
}
var TIMESTAMP_LENGTH = "YYYY-MM-DDTHH:MM:SS".length;
function commentBlock(comment) {
  const author = sanitize(comment.author?.displayName) || "unknown";
  const created = sanitize(comment.created).slice(0, TIMESTAMP_LENGTH);
  const heading = created ? `### ${author} \xB7 ${created}` : `### ${author}`;
  const body = shiftHeadings(comment.body ?? "", COMMENT_HEADING_OFFSET).trimEnd();
  return `${heading}

${body || "_empty_"}`;
}
var COMMENT_HEADING_OFFSET = 3;
var HEADING_RE = /^(#{1,6})(\s)/;
var FENCE_RE = /^\s*(```|~~~)/;
function shiftHeadings(markdown, offset) {
  let fence2;
  return markdown.split("\n").map((line) => {
    const marker = FENCE_RE.exec(line)?.[1];
    if (marker !== void 0) {
      fence2 = fence2 === void 0 ? marker : fence2 === marker ? void 0 : fence2;
      return line;
    }
    if (fence2 !== void 0) return line;
    return line.replace(
      HEADING_RE,
      (_all, hashes, space) => `${"#".repeat(Math.min(6, hashes.length + offset))}${space}`
    );
  }).join("\n");
}

// ../../plugins/jira/src/commands/work-item.ts
var WORK_ITEM_FETCH_SCHEMA = "jira-workflows/work-item-fetch/v1";
function fetchFailureVerdict(error, key, site) {
  if (error.code === "wrong-site" || error.code === "cloud-id-unresolved") {
    return fail(WORK_ITEM_FETCH_SCHEMA, [{ code: "site-unresolved", detail: error.message }], {
      key,
      site: site ?? null,
      sites: error.sites
    });
  }
  const code = error.code;
  return fail(WORK_ITEM_FETCH_SCHEMA, [{ code, detail: error.message }], {
    key,
    site: site ?? null
  });
}
async function readOrPrintFailure(options) {
  try {
    return await readWorkItem(options);
  } catch (error) {
    if (error instanceof FetchWorkItemError) {
      printVerdict(fetchFailureVerdict(error, options.key, options.site));
      return void 0;
    }
    throw error;
  }
}
function registerWorkItemCommands(program2, options) {
  const stores = createClaudeStores(options);
  const memory = createJiraMemory(stores);
  const workItem = program2.command("work-item").description("Read and write a Jira work item's stored record");
  workItem.command("get").description(
    "Print the stored work item for a Jira issue as JSON, fetching and storing it first where the scope holds none; --refresh reads Jira regardless, --render draws it as a panel"
  ).requiredOption("--key <issue-key>", "Jira issue key").option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).option("-s, --scope <session|plugin>", "memory scope to read, and to fetch into", "session").option("--refresh", "read Jira even where the scope holds a record, and replace it").option("--render", "draw the record as one fenced panel instead of printing JSON").option("--comments", "with --render, append the comment thread as markdown after the panel").option("--full", "print the whole stored record, with every custom field and Jira bookkeeping").option("--fields <a,b.c>", "comma-separated dotted paths; the output holds only those").action(async (opts) => {
    const key = issueKeyArgument(opts.key);
    if (opts.comments && !opts.render) {
      throw new UsageError("--comments requires --render");
    }
    if (opts.render && opts.fields !== void 0) {
      throw new UsageError("--fields and --render exclude each other");
    }
    if (opts.full && (opts.render || opts.fields !== void 0)) {
      throw new UsageError("--full excludes --render and --fields");
    }
    resolveScope(stores, opts.scope);
    const scope = opts.scope;
    const read = await readOrPrintFailure({
      key,
      site: opts.site,
      scope,
      refresh: opts.refresh,
      memory
    });
    if (read === void 0) return;
    const item = opts.full || opts.fields !== void 0 ? projectRecord(read.record, WORK_ITEM_FIELDS, parseFieldsOption(opts.fields), false) : agentView(read.record);
    const panels = opts.render ? renderStoredWorkItem(read.record, { comments: opts.comments }) : "";
    const reason = read.fetched && scope === "session" ? await flushSessionLink(options, stores) : void 0;
    if (reason !== void 0) {
      printVerdict(
        warn(
          WORK_ITEM_FETCH_SCHEMA,
          [reason],
          {
            key,
            site: opts.site ?? null,
            item: opts.render ? null : item
          },
          { panels }
        )
      );
    } else if (opts.render) {
      process.stdout.write(panels);
    } else {
      console.log(JSON.stringify(item, null, 2));
    }
  });
  workItem.command("set").description(
    "Read one work item as JSON from stdin and store it, replacing any existing record"
  ).requiredOption("--key <issue-key>", "Jira issue key").option("--site <site>", "disambiguate when the project indexes more than one site").requiredOption("-s, --scope <session|plugin>", "memory scope to write to").action(async (opts) => {
    const issueKey = issueKeyArgument(opts.key);
    const cloudId = await resolveCloudId({ key: issueKey, site: opts.site, memory });
    const store = resolveScope(stores, opts.scope);
    const item = await readWorkItemFromStdin(cloudId, issueKey);
    await store.set(jiraKeys.workItem(cloudId, issueKey), item);
    console.log(JSON.stringify(item, null, 2));
  });
  workItem.command("create").description(
    "Create a work item in Jira via twg, then store it in the session scope, linking the session to it; prints a verdict"
  ).requiredOption("--space <key>", "Jira project key, id, or ARI").requiredOption("--type <name>", "work type name, e.g. Task or Bug").requiredOption("--summary <text>", "the item\u2019s title").option("--description <text>", "the description body; excludes --description-file").option(
    "--description-file <path>",
    "a file holding the description body; excludes --description"
  ).option(
    "--description-format <format>",
    `the description\u2019s input format: ${DESCRIPTION_FORMATS.join(", ")}; twg defaults to html`
  ).option("--parent <issue-key>", "the parent item\u2019s key").option(
    "--field <id=value>",
    "an extra field by customfield_* id or name, passed through to the create unchanged; repeatable",
    (value, previous = []) => [...previous, value]
  ).option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).action(async (opts) => {
    if (opts.description !== void 0 && opts.descriptionFile !== void 0) {
      throw new UsageError("--description and --description-file exclude each other");
    }
    const description = opts.descriptionFile !== void 0 ? await readFile(opts.descriptionFile, "utf8") : opts.description;
    const verdict = await createWorkItem({
      space: opts.space,
      type: opts.type,
      summary: opts.summary,
      description,
      descriptionFormat: opts.descriptionFormat,
      parent: opts.parent,
      fields: opts.field,
      site: opts.site,
      memory
    });
    printVerdict(
      verdict.linked ? await withSessionLinkResult(verdict, options, stores) : verdict
    );
    if (verdict.key !== null) noteAdoption({ aiResultAction: "workItemCreated" });
  });
  workItem.command("comment").description(
    "Post a comment on a work item via twg, then link the session to the item; prints a verdict"
  ).requiredOption("--key <issue-key>", "Jira issue key").requiredOption("--body <text>", "the comment body").option(
    "--body-format <format>",
    `the body\u2019s input format: ${BODY_FORMATS.join(", ")}; twg defaults to html`
  ).option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).action(async (opts) => {
    const verdict = await commentOnWorkItem({
      key: issueKeyArgument(opts.key),
      body: opts.body,
      bodyFormat: opts.bodyFormat,
      site: opts.site,
      memory
    });
    printVerdict(
      verdict.linked ? await withSessionLinkResult(verdict, options, stores) : verdict
    );
    if (verdict.comment !== null) noteAdoption({ aiResultAction: "commentPosted" });
  });
  workItem.command("transition").description("Transition a stored work item to a named status, then update its stored status").requiredOption("--key <issue-key>", "Jira issue key").option("--site <site>", "disambiguate when the project indexes more than one site").requiredOption("-s, --scope <session|plugin>", "memory scope to read and update").requiredOption("--to <status-name>", "the target status name, matched case-insensitively").action(async (opts) => {
    const key = issueKeyArgument(opts.key);
    resolveScope(stores, opts.scope);
    const outcome = await transitionWorkItem({
      key,
      site: opts.site,
      scope: opts.scope,
      to: opts.to,
      memory
    });
    console.log(JSON.stringify(outcome, null, 2));
    if (outcome.transition !== null) noteAdoption({ aiResultAction: "workItemTransitioned" });
  });
  workItem.command("draft-validate").description(
    "Validate a drafted work item's Title and its fields against a template, and render the Description; prints a verdict"
  ).requiredOption("--title <text>", "drafted title").option("--template <name>", "the work item template; reads the fields JSON from stdin").option(
    "--raw",
    "a Dictated draft: reads the whole Description from stdin, checks the title only"
  ).option(
    "--path <dir>",
    "a directory inside the working tree; defaults to the current directory"
  ).option("--fields-file <path>", "read the fields JSON from a file instead of stdin").action(async (opts) => {
    if (opts.raw === true && opts.template !== void 0) {
      throw new UsageError("--template and --raw exclude each other; give one");
    }
    const { template, fieldsFile } = opts;
    if (opts.raw !== true && template === void 0) {
      throw new UsageError("One of --template <name> or --raw is required");
    }
    if (opts.raw === true && fieldsFile !== void 0) {
      throw new UsageError("--fields-file takes the fields of a template; --raw reads stdin");
    }
    if (fieldsFile === void 0 && process.stdin.isTTY === true) {
      throw new Error(
        opts.raw === true ? "No stdin piped; --raw reads the whole Description from it." : "No stdin piped and --fields-file was not given; the fields JSON is required."
      );
    }
    const input = template === void 0 ? { kind: "raw", description: await text4(process.stdin) } : {
      kind: "template",
      name: template,
      fields: fieldsFile === void 0 ? await text4(process.stdin) : await readFile(fieldsFile, "utf8")
    };
    printVerdict(validateDraft({ title: opts.title, path: opts.path ?? process.cwd(), input }));
  });
  workItem.command("preflight").description("Resolve a Jira destination\u2019s project, work type, and required custom fields").requiredOption("--destination <key|url|board-name>", "project key, Jira URL, or board name").option("--type <name>", "Jira work type name or ID; wins over the template's declared type").option(
    "--template <name>",
    "the work item template the draft was composed from; its declared work type is used where --type is absent"
  ).option(
    "--path <dir>",
    "a directory inside the working tree whose templates are in force; defaults to the current directory"
  ).option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).option(
    "--refresh",
    "make the live twg calls even where the project's configuration is stored, and rewrite the record"
  ).option(
    "--field <id=value>",
    "a field already decided, by customfield_* id or name, in the form work-item create takes; repeatable",
    (value, previous = []) => [...previous, value]
  ).action(async (opts) => {
    const fieldsPayload = fieldsPayloadOf(opts.field ?? []);
    const verdict = await preflightDestination({
      destination: opts.destination,
      type: opts.type,
      template: opts.template,
      path: opts.path,
      site: opts.site,
      fieldsPayload,
      refresh: opts.refresh,
      memory
    });
    printVerdict(verdict);
  });
  workItem.command("link").description("Resolve, write, and verify a directional Jira issue link; prints a verdict").requiredOption("--key <issue-key>", "source issue key, as the relationship phrase states it").requiredOption(
    "--target <issue-key>",
    "target issue key, as the relationship phrase states it"
  ).requiredOption(
    "--relationship <phrase>",
    'inward or outward label of the desired link type, e.g. "is blocked by"'
  ).option(
    "--link-type <name-or-id>",
    "link type to write when --relationship matches more than one; the phrase still decides direction"
  ).option("--site <site>", "disambiguate when the project indexes more than one site").option("--dry-run", "resolve and print the verdict without writing or verifying anything").action(async (opts) => {
    const from = issueKeyArgument(opts.key);
    const to = issueKeyArgument(opts.target);
    const verdict = await linkWorkItem({
      key: from,
      target: to,
      relationship: opts.relationship,
      linkType: opts.linkType,
      site: opts.site,
      dryRun: opts.dryRun ?? false
    });
    printVerdict(verdict);
  });
  return program2;
}
async function readWorkItemFromStdin(cloudId, issueKey) {
  const raw = await text4(process.stdin);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Malformed JSON on stdin: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!isJsonValue(parsed) || !isJsonObject(parsed)) {
    throw new Error("stdin must contain a single JSON object representing one work item");
  }
  return { ...markdownizeWorkItem(parsed), cloudId, key: issueKey };
}
function registerWorkItemClaimCommands(program2, options) {
  const stores = createClaudeStores(options);
  const memory = createJiraMemory(stores);
  const workItem = program2.commands.find((command) => command.name() === "work-item") ?? program2.command("work-item").description("Read and write a Jira work item's stored record");
  workItem.command("claim").description(
    "Assign the item to the caller and transition it to In Progress, deciding every step from a live read; prints a verdict"
  ).requiredOption("--key <issue-key>", "Jira issue key").option(
    "--site <site>",
    "Jira site; omit for the project's indexed site, then twg's default site"
  ).option(
    "--path <dir>",
    "the working tree --prepare-branch reads; defaults to the current directory"
  ).option("--plan-only", "plan and report; write nothing").option("--take-over", "assign an item that is currently someone else\u2019s").option("--skip-assignee", "start the item without changing its assignee").option(
    "--status <name>",
    "the In Progress-category status to land in, where the discovery advertises more than one"
  ).option(
    "--field <customfield_id=value>",
    "a transition-screen field, passed through to the update unchanged; repeatable",
    (value, previous = []) => [...previous, value]
  ).option(
    "--prepare-branch",
    "after the claim, where the tree is on its default branch, prepare the item\u2019s branch"
  ).option(
    "--no-fetch",
    "under --prepare-branch, do not refresh origin/<default branch> before cutting the branch off it"
  ).action(async (opts, command) => {
    const verdict = await claimWorkItem({
      key: opts.key,
      site: opts.site,
      path: opts.path,
      planOnly: opts.planOnly,
      takeOver: opts.takeOver,
      skipAssignee: opts.skipAssignee,
      status: opts.status,
      fields: opts.field,
      prepareBranch: opts.prepareBranch,
      fetch: fetchFlag(command),
      memory
    });
    printVerdict(await withSessionLinkResult(verdict, options, stores));
    if (verdict.applied?.ok === true) noteAdoption({ aiResultAction: "workItemClaimed" });
  });
  return program2;
}

// ../../plugins/jira/src/signals/commit-guard.ts
var COMMIT_GUARD_MARKER = "commit-guard-allowed";
function buildDenyOutput(reason) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason
    }
  });
}
function prepareCommand(item) {
  return item.assigned ? `branch prepare --key ${item.key}` : `work-item claim --key ${item.key} --prepare-branch`;
}
var ANYWAY = "or to commit on the default branch anyway, by running `hook allow-default-branch` and then committing again. Default the branch. Do not create or switch a branch yourself. See publish-changes.md's Committing section.";
function buildDenyReason(branch, items) {
  const lead = `This commit would land on ${branch}, the default branch, while the session holds `;
  if (items.length === 1) {
    const item = items[0];
    return `${lead}${item.key}. Ask the user whether to prepare the item's branch first, by running \`${prepareCommand(item)}\` (the jira plugin CLI), ${ANYWAY}`;
  }
  const keys = items.map((item) => item.key).join(", ");
  const commands = items.map((item) => `- ${item.key}: \`${prepareCommand(item)}\``).join("\n");
  return `${lead}${keys}. Ask the user which item this commit belongs to, then whether to prepare that item's branch first, by running its command (the jira plugin CLI):
${commands}
${ANYWAY}`;
}
async function guardedItems(stores) {
  const parsed = (await stores.session.keys()).map(parseWorkItemKeyName).filter((entry) => entry !== void 0);
  if (parsed.length === 0) return [];
  const user = await getCurrentUser(stores.plugin);
  const items = [];
  for (const { cloudId, issueKey } of parsed) {
    const record = await stores.session.get(jiraKeys.workItem(cloudId, issueKey));
    const assigned = user !== void 0 && user.displayName !== null && record?.assignee?.displayName === user.displayName;
    items.push({ key: issueKey, assigned });
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}
async function resolveCommitGuard(stores, payload, git = runGit) {
  if (payload === void 0 || !isJsonObject(payload) || payload.hook_event_name !== "PreToolUse") {
    return void 0;
  }
  const call = readBashCall(payload);
  if (call === void 0 || !isGitCommit(call.command)) return void 0;
  const cwd = payload.cwd;
  if (typeof cwd !== "string" || cwd === "") return void 0;
  try {
    const branch = currentBranch(cwd, git);
    if (branch === null || branch !== defaultBranch(cwd, git)) return void 0;
    const items = await guardedItems(stores);
    if (items.length === 0) return void 0;
    if (await hasMarker(stores.session, COMMIT_GUARD_MARKER)) return void 0;
    return buildDenyOutput(buildDenyReason(branch, items));
  } catch {
    return void 0;
  }
}
function allowDefaultBranchCommits(sessionStore) {
  return claimMarker(sessionStore, COMMIT_GUARD_MARKER);
}

// ../../plugins/jira/src/signals/hooks/turn-activity.ts
function collectTurnActivity(payload, options) {
  if (payload === void 0 || !isJsonObject(payload) || payload.session_id !== options.sessionId)
    return [];
  const hostTurn = payload.turn_id ?? payload.prompt_id;
  if (typeof hostTurn !== "string" || !hostTurn.trim()) return [];
  if (!Number.isSafeInteger(options.observedAt) || options.observedAt <= 0) return [];
  const base2 = {
    turnId: hashIdentifier(`${options.sessionId}\0${hostTurn}`),
    at: options.observedAt,
    ...typeof payload.agent_id === "string" && payload.agent_id ? { agentId: hashIdentifier(payload.agent_id) } : {}
  };
  const event = payload.hook_event_name;
  if (event === "SubagentStart" && base2.agentId !== void 0)
    return [{ ...base2, kind: "delegation", agentId: base2.agentId }];
  if (["UserPromptSubmit", "Stop", "StopFailure", "Interrupt"].includes(String(event))) {
    if (payload.agent_id !== void 0) return [];
    if (event === "UserPromptSubmit") return [{ ...base2, kind: "start" }];
    if (event === "Interrupt" || event === "StopFailure") return [{ ...base2, kind: "abort" }];
    if (typeof payload.last_assistant_message !== "string" || !payload.last_assistant_message.trim())
      return [];
    return [{ ...base2, kind: "stop" }];
  }
  if (event !== "PostToolUse" || !["Bash", "PowerShell"].includes(String(payload.tool_name)))
    return [];
  if (typeof payload.tool_use_id !== "string" || !payload.tool_use_id) return [];
  const response = payload.tool_response;
  const stdout = typeof response === "string" ? response : response !== void 0 && isJsonObject(response) && !responseFailed(response) ? response.stdout : void 0;
  if (typeof stdout !== "string" || stdout.length > 1048576 || !stdout.trim()) return [];
  return [
    {
      ...base2,
      kind: "output",
      toolUseId: hashIdentifier(payload.tool_use_id),
      fingerprint: hashIdentifier(stdout.trim())
    }
  ];
}
function responseFailed(value) {
  if (value === void 0 || !isJsonObject(value)) return false;
  return value.isError === true || value.is_error === true || value.interrupted === true || value.error != null || value.ok === false || value.success === false || value.status === "fail" || typeof value.exitCode === "number" && value.exitCode !== 0 || typeof value.exit_code === "number" && value.exit_code !== 0 || responseFailed(value.data);
}

// ../../plugins/jira/src/storage/turn-activity.ts
var hash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
var timestamp = (value) => Number.isSafeInteger(value) && Number(value) > 0;
function decodeEvidence(value) {
  if (value === void 0 || !isJsonObject(value)) return void 0;
  if (value.source === "persistedAssetRecall") return { source: value.source };
  if (value.source === "pluginSkill" && typeof value.skillName === "string" && value.skillName)
    return { source: value.source, skillName: value.skillName };
  return void 0;
}
function decodeTurnActivity(value) {
  if (!isJsonObject(value) || !hash(value.turnId) || !timestamp(value.at)) return void 0;
  if (value.agentId !== void 0 && !hash(value.agentId)) return void 0;
  const base2 = {
    turnId: value.turnId,
    at: value.at,
    ...typeof value.agentId === "string" ? { agentId: value.agentId } : {}
  };
  switch (value.kind) {
    case "start":
    case "stop":
    case "abort":
      return { ...base2, kind: value.kind };
    case "delegation":
      return typeof value.agentId === "string" ? { ...base2, kind: value.kind, agentId: value.agentId } : void 0;
    case "output":
      return hash(value.fingerprint) && hash(value.toolUseId) ? { ...base2, kind: value.kind, fingerprint: value.fingerprint, toolUseId: value.toolUseId } : void 0;
    case "evidence": {
      const evidence = decodeEvidence(value.evidence);
      return evidence === void 0 ? void 0 : { ...base2, kind: value.kind, evidence };
    }
    default:
      return void 0;
  }
}
var activityCodec = {
  version: 1,
  encode: (value) => decodeTurnActivity(value) ?? null,
  decode: decodeTurnActivity
};
var receiptCodec = {
  version: 1,
  encode: (value) => decodeCommandReceipt(value) ?? null,
  decode: decodeCommandReceipt
};
function decodeCommandReceipt(value) {
  if (!isJsonObject(value) || !hash(value.fingerprint) || !timestamp(value.startedAt) || !timestamp(value.finishedAt) || value.finishedAt < value.startedAt || typeof value.succeeded !== "boolean" || !Array.isArray(value.evidence))
    return void 0;
  const evidence = decodeArray(value.evidence, decodeEvidence);
  if (evidence === void 0) return void 0;
  return {
    fingerprint: value.fingerprint,
    startedAt: value.startedAt,
    finishedAt: value.finishedAt,
    succeeded: value.succeeded,
    evidence
  };
}
var TURN_ACTIVITY_PREFIX = "jira/analytics/turn-activity/";
var RECEIPT_PREFIX = "jira/analytics/command-receipts/";
var turnActivityKey = (id) => defineStorageKey(`${TURN_ACTIVITY_PREFIX}${id}`, activityCodec);
var commandReceiptKey = (id) => defineStorageKey(`${RECEIPT_PREFIX}${id}`, receiptCodec);
function createTurnActivityStore(store) {
  return {
    recordActivity: (id, activity) => store.claim(turnActivityKey(id), activity),
    recordReceipt: (id, receipt) => store.claim(commandReceiptKey(id), receipt),
    async read() {
      const activities = [];
      const receipts = [];
      for (const name of await store.keys()) {
        if (name.startsWith(TURN_ACTIVITY_PREFIX)) {
          const value = await store.get(turnActivityKey(name.slice(TURN_ACTIVITY_PREFIX.length)));
          if (value !== void 0) activities.push(value);
        } else if (name.startsWith(RECEIPT_PREFIX)) {
          const value = await store.get(commandReceiptKey(name.slice(RECEIPT_PREFIX.length)));
          if (value !== void 0) receipts.push(value);
        }
      }
      return { activities, receipts };
    }
  };
}

// ../../plugins/jira/src/signals/skill-invocation.ts
import { randomUUID as randomUUID4 } from "node:crypto";
var SKILL_NAME = "jira-workflows";
function canonicalSkillName(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const firstToken = value.trim().replace(/^\/+/, "").split(/\s+/, 1)[0];
  const normalized = firstToken?.split(":").at(-1)?.split("@")[0];
  return normalized === void 0 ? void 0 : normalized.toLowerCase();
}
function extractSkillInvocation(payload, uuid = randomUUID4) {
  if (payload === void 0 || !isJsonObject(payload)) {
    return void 0;
  }
  let rawSkillName;
  let invocationSource;
  let invocationId;
  if (payload.hook_event_name === "PostToolUse" && payload.tool_name === "Skill") {
    const input = isJsonObject(payload.tool_input) ? payload.tool_input : void 0;
    rawSkillName = input?.skill ?? input?.skill_name ?? input?.name ?? input?.command;
    invocationSource = "agentTool";
    invocationId = payload.tool_use_id;
  } else if (payload.hook_event_name === "UserPromptExpansion" && payload.expansion_type === "slash_command") {
    rawSkillName = payload.command_name;
    invocationSource = "userSlashCommand";
    invocationId = payload.prompt_id;
  } else {
    return void 0;
  }
  const skillName = canonicalSkillName(rawSkillName);
  if (skillName !== SKILL_NAME) {
    return void 0;
  }
  return {
    skillName,
    invocationSource,
    invocationId: typeof invocationId === "string" && invocationId.length > 0 ? invocationId : uuid()
  };
}

// ../../plugins/jira/src/signals/onboarding.ts
var ONBOARDING_MARKER = "onboarding-shown";
function onboardingContext(guide) {
  return "This is the first jira-workflows invocation on this machine. Before acting on the request, print the guide below to the user verbatim, as markdown, then handle any request the invocation carried; a request to learn the skill is answered by the guide.\n\n" + guide;
}
async function resolveOnboarding(pluginStore, payload, readGuide2) {
  const invocation = extractSkillInvocation(payload);
  if (invocation === void 0) return void 0;
  const context = onboardingContext(readGuide2());
  if (!await claimMarker(pluginStore, ONBOARDING_MARKER)) return void 0;
  if (invocation.invocationSource === "userSlashCommand") return context;
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context }
  });
}

// ../../plugins/jira/src/onboarding/guide.ts
import { readFileSync as readFileSync5 } from "node:fs";
import path7 from "node:path";
var GUIDE_PATH = path7.join("skills", "jira-workflows", "assets", "onboarding.md");
var ROUTED_SECTION = "## What To Say";
function readGuideSource(pluginRoot) {
  return readFileSync5(path7.join(pluginRoot, GUIDE_PATH), "utf8");
}
function renderGuide(source) {
  let inRoutedSection = false;
  return source.split("\n").map((line) => {
    if (line.startsWith("## ")) inRoutedSection = line.trim() === ROUTED_SECTION;
    if (!inRoutedSection || !line.startsWith("|")) return line;
    const cells = line.split("|").slice(1, -1);
    return `|${cells.slice(0, -1).join("|")}|`;
  }).join("\n");
}
function readGuide(pluginRoot) {
  return renderGuide(readGuideSource(pluginRoot));
}

// ../../plugins/jira/src/commands/hook.ts
function registerHookCommands(program2, options, pluginRoot, input) {
  const hook = program2.command("hook").description("Entry points invoked by the plugin hooks");
  const stores = createClaudeStores(options);
  const payload = input?.payload;
  const sessionId = options.sessionId;
  const pluginDataDirectory = stores.paths.pluginDataDirectory;
  hook.command("turn-activity").description("Internal: record turn lifecycle activity").action(async () => {
    const observedAt = Date.now();
    if (isAnalyticsDisabled(options.env ?? process.env)) return;
    try {
      if (sessionId === void 0 || pluginDataDirectory === void 0) return;
      const activities = collectTurnActivity(payload, {
        sessionId,
        observedAt
      });
      const store = createTurnActivityStore(stores.session);
      for (const activity of activities)
        await store.recordActivity(hashIdentifier(JSON.stringify(activity)), activity);
    } catch {
    }
  });
  hook.command("link-prompt").description("Prompt to link a work item at a git touchpoint").action(async () => {
    try {
      if (sessionId === void 0) return;
      const output = await resolveLinkPrompt(stores.session, payload);
      if (output !== void 0) {
        process.stdout.write(output);
        noteHookAction("link-prompt-shown");
      }
    } catch {
    }
  });
  hook.command("commit-guard").description(
    "Deny a git commit about to land on the default branch while the session holds a work item"
  ).action(async () => {
    if (sessionId === void 0) return;
    const output = await resolveCommitGuard(stores, payload);
    if (output !== void 0) {
      process.stdout.write(output);
      noteHookAction("commit-denied");
    }
  });
  hook.command("allow-default-branch").description(
    "Record the choice to commit on the default branch, silencing commit-guard for the rest of the session"
  ).action(async () => {
    await allowDefaultBranchCommits(stores.session);
    console.log("Commits to the default branch are allowed for the rest of this session.");
  });
  hook.command("cache-user").description("Warm the plugin-scoped current-user cache, so claim skips its live user get").action(async () => {
    try {
      if (await getCurrentUser(stores.plugin) !== void 0) return;
      const env = options.env ?? process.env;
      const binary = resolveTwgBinary(env);
      const user = decodeCurrentUser(runTwgJson(binary, ["user", "get"]));
      if (user?.accountId !== void 0) {
        await setCurrentUser(stores.plugin, {
          accountId: user.accountId,
          displayName: user.displayName
        });
      }
    } catch {
    }
  });
  hook.command("session-analytics").description(
    'Emit the session-start "aiInteraction initiated" analytics event, once per session'
  ).action(async () => {
    try {
      if (sessionId === void 0) return;
      await runSessionAnalytics(stores.session, sessionId);
    } catch {
    }
  });
  hook.command("jira-launch").description(
    "Mark the session Jira-launched when its first prompt carries the <JIRA_WORK_ITEM> block"
  ).action(async () => {
    if (sessionId === void 0) return;
    await recordJiraLaunch(stores.session, payload);
  });
  hook.command("onboarding").description("Inject the first-use onboarding guide on the first jira-workflows invocation").action(async () => {
    try {
      const output = await resolveOnboarding(stores.plugin, payload, () => readGuide(pluginRoot));
      if (output !== void 0) {
        process.stdout.write(output);
        noteHookAction("onboarding-shown");
      }
    } catch {
    }
  });
  hook.command("skill-analytics").description(
    'Emit the "aiSessionSkill accessed" analytics event for a jira-workflows invocation'
  ).action(async () => {
    try {
      if (sessionId === void 0) return;
      const invocation = extractSkillInvocation(payload);
      if (invocation === void 0) return;
      if (await claimMarker(stores.session, `analytics-skill-${invocation.invocationId}`)) {
        await emitSkillAnalytics(
          {
            agentSessionId: sessionId,
            invocation: {
              skillName: invocation.skillName,
              invocationSource: invocation.invocationSource
            }
          },
          // The session store supplies the linked-item context, so the skill
          // event can be sliced linked-vs-orphaned on its own.
          { sessionStore: stores.session, queueStore: stores.plugin }
        );
      }
    } catch {
    }
  });
  hook.command("session-end-flush").description("SessionEnd: defer the pending link-signal flush to a detached background process").action(async () => {
    if (sessionId !== void 0 && pluginDataDirectory !== void 0) {
      deferLinkSignalFlush({ sessionId, pluginDataDirectory });
    }
  });
  hook.command("session-end-signal").description("SessionEnd: defer the ACPS session_end signal to a detached background process").action(async () => {
    if (sessionId !== void 0 && pluginDataDirectory !== void 0) {
      deferSessionEndSignal({ sessionId, pluginDataDirectory });
    }
  });
  return program2;
}

// ../../plugins/jira/src/commands/onboarding.ts
function registerOnboardingCommands(program2, pluginRoot) {
  program2.command("onboarding").description("Print the jira-workflows onboarding guide").action(() => {
    process.stdout.write(readGuide(pluginRoot));
  });
  return program2;
}

// ../../plugins/jira/src/commands/gc.ts
import { text as text5 } from "node:stream/consumers";

// ../../plugins/jira/src/gc/sweep.ts
import { promises as fs4 } from "node:fs";

// ../../plugins/jira/src/storage/gc.ts
var throttleCodec = {
  version: 1,
  encode: (value) => ({ sweptAt: value.sweptAt }),
  decode: (value) => {
    if (!isJsonObject(value)) {
      return void 0;
    }
    const sweptAt = stringProperty(value, "sweptAt");
    return sweptAt === void 0 ? void 0 : { sweptAt };
  }
};
var reportCodec = {
  version: 1,
  encode: (value) => ({
    sweptAt: value.sweptAt,
    maxAgeMs: value.maxAgeMs,
    examined: value.examined,
    skippedCount: value.skippedCount,
    removed: value.removed.map((removal) => ({
      sessionId: removal.sessionId,
      path: removal.path,
      ageSource: removal.ageSource,
      newestActivityAt: removal.newestActivityAt
    }))
  }),
  decode: decodeReport
};
var gcKeys = {
  lastSweep: defineStorageKey("storage/gc/last-sweep", throttleCodec),
  lastReport: defineStorageKey("storage/gc/last-report", reportCodec)
};
function decodeReport(value) {
  if (!isJsonObject(value)) {
    return void 0;
  }
  const sweptAt = stringProperty(value, "sweptAt");
  const maxAgeMs = numberProperty(value, "maxAgeMs");
  const examined = numberProperty(value, "examined");
  const skippedCount = numberProperty(value, "skippedCount");
  const removedValue = value.removed;
  if (sweptAt === void 0 || maxAgeMs === void 0 || examined === void 0 || skippedCount === void 0 || !Array.isArray(removedValue)) {
    return void 0;
  }
  const removed = [];
  for (const entry of removedValue) {
    if (!isJsonObject(entry)) {
      return void 0;
    }
    const sessionId = stringProperty(entry, "sessionId");
    const removalPath = stringProperty(entry, "path");
    const ageSource = stringProperty(entry, "ageSource");
    const newestActivityAt = stringProperty(entry, "newestActivityAt");
    if (sessionId === void 0 || removalPath === void 0 || ageSource === void 0 || newestActivityAt === void 0) {
      return void 0;
    }
    removed.push({ sessionId, path: removalPath, ageSource, newestActivityAt });
  }
  return { sweptAt, maxAgeMs, examined, skippedCount, removed };
}

// ../../plugins/jira/src/gc/sweep.ts
var SESSION_RETENTION_MS = 21 * 864e5;
var SWEEP_INTERVAL_MS = 24 * 36e5;
async function runSessionGc(options) {
  const { stores, now } = options;
  const maxAgeMs = options.maxAgeMs ?? SESSION_RETENTION_MS;
  const intervalMs = options.intervalMs ?? SWEEP_INTERVAL_MS;
  const dryRun = options.dryRun === true;
  const sweep = options.sweep ?? sweepSessionDirectories;
  try {
    const { pluginDataDirectory, sessionsRootDirectory } = stores.paths;
    if (pluginDataDirectory === void 0 || sessionsRootDirectory === void 0) {
      return { kind: "no-data-directory" };
    }
    if (!await directoryExists(pluginDataDirectory)) {
      return { kind: "no-data" };
    }
    if (options.currentSessionId === void 0 || options.currentSessionId.length === 0) {
      return { kind: "no-session-id" };
    }
    const lastSweep = await stores.plugin.get(gcKeys.lastSweep);
    if (options.force !== true && lastSweep !== void 0) {
      const lastSweptMs = Date.parse(lastSweep.sweptAt);
      if (!Number.isNaN(lastSweptMs) && now.getTime() - lastSweptMs < intervalMs) {
        return { kind: "throttled", lastSweptAt: lastSweep.sweptAt };
      }
    }
    if (!dryRun) {
      await stores.plugin.set(gcKeys.lastSweep, { sweptAt: now.toISOString() });
    }
    const report = await sweep({
      sessionsRootDirectory,
      currentSessionId: options.currentSessionId,
      maxAgeMs,
      now,
      dryRun
    });
    if (!dryRun) {
      const gcReport = {
        sweptAt: report.sweptAt,
        maxAgeMs: report.maxAgeMs,
        examined: report.examined,
        skippedCount: report.skipped.length,
        removed: report.removed.map((removal) => ({
          sessionId: removal.sessionId,
          path: removal.path,
          ageSource: removal.ageSource,
          newestActivityAt: removal.newestActivityAt
        }))
      };
      await stores.plugin.set(gcKeys.lastReport, gcReport);
    }
    return { kind: "swept", report };
  } catch (error) {
    return { kind: "failed", message: error instanceof Error ? error.message : String(error) };
  }
}
async function directoryExists(candidate) {
  try {
    return (await fs4.stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

// ../../plugins/jira/src/commands/gc.ts
async function resolveCurrentSessionId(fromCliOptions) {
  if (fromCliOptions !== void 0 && fromCliOptions.length > 0) {
    return fromCliOptions;
  }
  if (process.stdin.isTTY === true) {
    return void 0;
  }
  let raw;
  try {
    raw = await text5(process.stdin);
  } catch {
    return void 0;
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return void 0;
    }
    const sessionId = parsed.session_id;
    return typeof sessionId === "string" && sessionId.length > 0 ? sessionId : void 0;
  } catch {
    return void 0;
  }
}
function registerGcCommands(program2, options) {
  const stores = createClaudeStores(options);
  program2.command("gc").description(
    "Remove session memory directories older than the 21-day retention (silent by default)"
  ).option("--report", "print what the sweep did; without it, nothing is written to stdout").option("--dry-run", "report what would be removed and remove nothing").option("--force", "sweep even if one already ran within the last 24 hours").action(async (opts) => {
    const outcome = await runSessionGc({
      stores,
      currentSessionId: await resolveCurrentSessionId(options.sessionId),
      now: /* @__PURE__ */ new Date(),
      maxAgeMs: SESSION_RETENTION_MS,
      force: opts.force === true,
      dryRun: opts.dryRun === true
    });
    if (outcome.kind === "failed") {
      console.error(`jira gc: ${outcome.message}`);
    }
    if (opts.report === true) {
      console.log(describeOutcome(outcome));
    }
  });
  return program2;
}
function describeOutcome(outcome) {
  switch (outcome.kind) {
    case "no-data-directory":
      return "Nothing swept: no plugin data directory resolved. The default ~/.jira needs a home directory, and neither JIRA_DATA_HOME nor --plugin-data <dir> was set.";
    case "no-data":
      return "Nothing to sweep: this plugin has no data directory yet.";
    case "no-session-id":
      return "Nothing swept: no current session id resolved from --session-id, the hook payload on stdin, or CLAUDE_CODE_SESSION_ID/CODEX_SESSION_ID, so no directory could be excluded from removal. Use `prune-sessions --older-than <duration> --yes` to sweep by hand.";
    case "throttled":
      return `Nothing swept: a sweep already ran at ${outcome.lastSweptAt}.`;
    case "swept":
      return formatSessionSweepReport(outcome.report);
    case "failed":
      return `Sweep failed: ${outcome.message}`;
  }
}

// ../../plugins/jira/src/commands/analytics.ts
function registerAnalyticsCommands(program2, options) {
  const stores = createClaudeStores(options);
  program2.command("analytics", { hidden: true }).description("Internal: emit plugin analytics out of band").command("emit").description("Emit a finished command's analytics events; started detached by the CLI itself").requiredOption("--outcome <encoded>", "the run to report, as encoded by the CLI").action(async (opts) => {
    const sessionId = options.sessionId;
    const outcome = decodeOutcome(opts.outcome);
    if (sessionId === void 0 || outcome === void 0) return;
    try {
      await emitCommandOutcome(outcome, sessionId, {
        sessionStore: stores.session,
        queueStore: stores.plugin
      });
      if (outcome.linkSignals?.length) {
        await drainAnalyticsQueue({
          store: stores.plugin,
          post: postQueuedBody,
          env: options.env ?? process.env
        });
      }
    } catch {
    }
  });
  return program2;
}

// ../../plugins/jira/src/bin/unexpected-error.ts
var UNEXPECTED_ERROR_SCHEMA = "jira-workflows/unexpected-error/v1";
var UNEXPECTED_ERROR_CODE = "unexpected-error";
var MAX_CAUSES = 8;
function nameAndMessage(value) {
  if (value instanceof Error) {
    return { name: value.name || "Error", message: value.message };
  }
  return { name: "Error", message: typeof value === "string" ? value : String(value) };
}
function describeError(error) {
  const { name, message } = nameAndMessage(error);
  const cause = [];
  const seen = /* @__PURE__ */ new Set([error]);
  let current = error instanceof Error ? error.cause : void 0;
  while (current !== void 0 && cause.length < MAX_CAUSES && !seen.has(current)) {
    seen.add(current);
    const described = nameAndMessage(current);
    cause.push(`${described.name}: ${described.message}`);
    current = current instanceof Error ? current.cause : void 0;
  }
  return { name, message, cause };
}
function unexpectedErrorVerdict(error, commandPath) {
  const described = describeError(error);
  return fail(
    UNEXPECTED_ERROR_SCHEMA,
    [{ code: UNEXPECTED_ERROR_CODE, detail: `${described.name}: ${described.message}` }],
    {
      command: commandPath !== void 0 && commandPath.length > 0 ? commandPath : null,
      error: described
    }
  );
}

// ../../plugins/jira/src/bin/hook-input.ts
async function prepareHookCommand(argv, options) {
  if (argv[0] !== "hook" || argv[1] === void 0 || argv[1] === "allow-default-branch" || argv.some((arg) => ["--help", "-h", "--version", "-V"].includes(arg))) {
    return { options, input: void 0 };
  }
  const rawPayload = await readRawHookPayload();
  let payload;
  try {
    const parsed = JSON.parse(rawPayload ?? "");
    if (isJsonValue(parsed)) payload = parsed;
  } catch {
  }
  const candidate = payload !== void 0 && isJsonObject(payload) && typeof payload.session_id === "string" ? payload.session_id : void 0;
  let sessionId = options.sessionId ?? candidate;
  if (sessionId !== void 0 && sessionId.trim() === "") sessionId = void 0;
  try {
    if (sessionId !== void 0) requireSafeSessionId(sessionId);
  } catch {
    sessionId = void 0;
  }
  return { options: { ...options, sessionId }, input: { rawPayload, payload } };
}

// ../../plugins/jira/src/bin/cli.ts
var PLUGIN_ID = "jira";
var SESSION_ID_FLAG = "--session-id";
function resolveStorageOptions(overrides) {
  return {
    pluginId: PLUGIN_ID,
    sessionId: process.env.CLAUDE_CODE_SESSION_ID ?? process.env.CODEX_SESSION_ID ?? overrides.sessionId,
    pluginDataDirectory: resolvePluginDataDirectory(process.env, overrides.pluginData),
    pluginDataFallback: "reject",
    noPluginDataMessage: NO_HOME_DIRECTORY_MESSAGE
  };
}
function extractProgramOverrides(argv) {
  const rest = [];
  const found = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const flag = [SESSION_ID_FLAG, PLUGIN_DATA_FLAG].find(
      (candidate) => arg === candidate || arg.startsWith(`${candidate}=`)
    );
    if (flag === void 0) {
      rest.push(arg);
      continue;
    }
    if (arg === flag) {
      found[flag] = argv[i + 1];
      i += 1;
    } else {
      found[flag] = arg.slice(flag.length + 1);
    }
  }
  return { sessionId: found[SESSION_ID_FLAG], pluginData: found[PLUGIN_DATA_FLAG], rest };
}
function buildProgram(options, hookInput) {
  const program2 = new Command().name("jira").description("The Jira plugin's CLI").version(
    readPluginVersion(import.meta.url),
    "-V, --version",
    "print the version stamped into the plugin tree this binary runs from"
  ).option(
    "--session-id <id>",
    "session id for the 'session' scope, used only when CLAUDE_CODE_SESSION_ID and CODEX_SESSION_ID are unset"
  ).option(
    `${PLUGIN_DATA_FLAG} <dir>`,
    "plugin data directory, for a hand-run command; otherwise JIRA_DATA_HOME, then ~/.jira"
  ).enablePositionalOptions().exitOverride().configureOutput({ writeErr: () => {
  } });
  registerStorageCommands(program2, options, {
    onRead: (keys) => {
      const counts = /* @__PURE__ */ new Map();
      for (const key of keys) {
        const type = assetTypeForStoredKey(key);
        if (type === void 0) continue;
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
      for (const [assetType, assetCount] of counts)
        noteAssetRetrieval({ assetType, assetCount, retrievalSource: "local" });
    }
  });
  registerWorkItemCommands(program2, options);
  registerWorkItemClaimCommands(program2, options);
  registerProjectContextCommands(program2, options);
  registerCloudSitesRenderCommands(program2, options);
  registerSessionSignalCommands(program2, options);
  const pluginRoot = pluginRootOf(import.meta.url);
  registerHookCommands(program2, options, pluginRoot, hookInput);
  registerOnboardingCommands(program2, pluginRoot);
  registerGcCommands(program2, options);
  registerBranchCommands(program2, options);
  registerChangesCommands(program2, options);
  registerTemplateCommands(program2);
  registerAnalyticsCommands(program2, options);
  return program2;
}
async function main() {
  const startedAt = Date.now();
  const { rest, ...parsed } = extractProgramOverrides(process.argv.slice(2));
  const overrides = rest[0] === "session" && rest[1] === "signal" ? { ...parsed, sessionId: await resolveSignalSessionId(parsed.sessionId, rest.join(" ")) } : parsed;
  const { options: storage, input: hookInput } = await prepareHookCommand(
    rest,
    resolveStorageOptions(overrides)
  );
  const program2 = buildProgram(storage, hookInput);
  let actionPath;
  program2.hook("preAction", (_program, action) => {
    actionPath = commandPathOf(action);
  });
  let thrown;
  try {
    await program2.parseAsync(rest, { from: "user" });
  } catch (error) {
    thrown = error;
    reportError(error, actionPath);
  }
  if (isHelpOrVersion(thrown)) return;
  try {
    reportCommandOutcome({
      program: program2,
      rest,
      actionPath,
      storage,
      startedAt,
      thrown
    });
  } catch {
  }
}
function reportCommandOutcome(input) {
  const { program: program2, rest, actionPath, storage, startedAt, thrown } = input;
  const commandPath = actionPath ?? commandPathFromArgv(program2, rest);
  if (commandPath === "") return;
  const hookAction = takeHookAction();
  const notes = takeOutcomeNotes();
  if (!shouldReport(commandPath, hookAction, thrown)) return;
  deferCommandAnalytics(
    outcomeOf({
      commandPath,
      startedAt,
      now: Date.now(),
      exitCode: typeof process.exitCode === "number" ? process.exitCode : 0,
      verdict: takePrintedVerdict(),
      error: thrown,
      hookAction,
      retrievals: notes.retrievals,
      adoptions: notes.adoptions,
      linkSignals: notes.linkSignals,
      memorySearch: notes.memorySearch
    }),
    { sessionId: storage.sessionId, pluginDataDirectory: storage.pluginDataDirectory }
  );
}
function isHelpOrVersion(error) {
  return error instanceof CommanderError && (error.code === "commander.helpDisplayed" || error.code === "commander.version" || error.code === "commander.help");
}
function isHostRunCommand(commandPath) {
  const head = commandPath?.split(" ")[0];
  return head === "hook" || head === "gc" || head === "session";
}
function reportError(error, commandPath) {
  if (error instanceof CommanderError) {
    if (error.code === "commander.helpDisplayed" || error.code === "commander.version") {
      process.exitCode = error.exitCode;
      return;
    }
    console.error(error.message);
    process.exitCode = USAGE_EXIT;
    return;
  }
  if (error instanceof UsageError) {
    console.error(error.message);
    process.exitCode = USAGE_EXIT;
    return;
  }
  if (isHostRunCommand(commandPath)) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  if (hasPrintedVerdict()) {
    console.error(error instanceof Error ? error.message : error);
    return;
  }
  printVerdict(unexpectedErrorVerdict(error, commandPath));
}
main().catch((error) => {
  reportError(error, void 0);
});
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 5.4.2 https://github.com/nodeca/js-yaml @license MIT *)
*/
