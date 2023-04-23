import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";

/**
 * 这个自定义的图片处理规则是干嘛的？
 * 我们将markdown的文档结构模型“token”转换成图片的时候，原始的转换方式会导致图片下面不能很方便的再插入一个新的编辑区块，我们要修改掉这种情况，将图片暴漏在最外层：
 * ![title](src) 解析后，
 * 原始token结构：
 * paragraph_open
 *     inline
 *         image     // 保留它
 *             text  // 保留它
 *         text
 *  paragraph_close
 * 我们要转换成的token结构：
 * image
 *     text
 * paragraph_open
 *     inline
 *         text
 * paragraph_close
 * ---
 * 再比如
 * paragraph_open
 *     inline
 *         text
 *         image     // 保留它
 *             text  // 保留它
 *         text
 *         image     // 保留它
 *             text  // 保留它
 *         text
 *  paragraph_close
 * 我们要转换成的token结构：
 * paragraph_open
 *     inline
 *         text
 * paragraph_close
 * image
 *     text
 * paragraph_open
 *     inline
 *         text
 * paragraph_close
 * image
 *     text
 * paragraph_open
 *     inline
 *         text
 * paragraph_close
 * @param md
 */
export default function image(md: MarkdownIt) {
  md.core.ruler.after("inline", "image", state => {
    const tokens = state.tokens;
    // console.log("处理之前，", tokens);
    // 即将要删除的标签
    const removePArr: Token[] = [];
    // const releaseImgArr: Token[] = [];
    let finalTokens = new Array<Token>();
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      // 我们将通过一系列复杂的条件判断来严格的判定即将插入的是一个图片
      if (
        token.type === "inline" &&
        token.children &&
        token.children.find(x => x.type === "image")
      ) {
        // 构造一个辅助用的二维数组，用img来分割它
        const temp2DArr = new Array<Token[] | ReadonlyArray<Token>>();
        temp2DArr.push(new Array<Token>());
        for (let index2 = 0; index2 < token.children.length; index2++) {
          const childToken = token.children[index2];
          if (childToken.type === "image") {
            const imgTokenArr: ReadonlyArray<Token> = [childToken];
            if (temp2DArr[temp2DArr.length - 1].length === 0) {
              temp2DArr[temp2DArr.length - 1] = imgTokenArr;
            } else {
              temp2DArr.push(imgTokenArr);
            }
            temp2DArr.push(new Array<Token>());
          } else {
            (temp2DArr[temp2DArr.length - 1] as Array<Token>).push(childToken);
          }
        }
        // 进一步处理这个二维数组，把里面的内容按格式输出
        temp2DArr.forEach(current => {
          if (current.length === 1 && current[0].type === "image") {
            // 插入 <img/>
            finalTokens.push(current[0]);
          } else {
            // 插入 <p><inline>something</inline></p>
            finalTokens.push(new Token("paragraph_open", "p", -1));
            const inlineToken = new Token("inline", "", 0);
            inlineToken.children = current as Token[];
            finalTokens.push(inlineToken);
            finalTokens.push(new Token("paragraph_close", "p", 1));
          }
        });

        // 图片前后的P标签，需要加入到删除队列
        const preToken = tokens[index - 1];
        const nextToken = tokens[index + 1];
        if (
          preToken &&
          nextToken &&
          preToken.type === "paragraph_open" &&
          nextToken.type === "paragraph_close"
        ) {
          if (preToken.tag === "p" && nextToken.tag === "p") {
            // 将图片组和p标签分别加入释放队列和删除队列
            // releaseImgArr.push(token);
            removePArr.push(preToken, nextToken);
          }
        }
      } else {
        // 如果没有包含图片，那么原样输出
        finalTokens.push(token);
      }
    }
    // 删除(过滤)掉部分token
    finalTokens = finalTokens.filter(x => !removePArr.includes(x));
    // console.log("处理之后，", tokens);
    state.tokens = finalTokens;

    return false;
  });
}
